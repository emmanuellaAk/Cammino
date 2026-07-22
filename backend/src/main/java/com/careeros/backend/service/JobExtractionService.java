package com.careeros.backend.service;

import com.careeros.backend.dto.response.JobExtractionResponse;
import com.careeros.backend.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/** Fetches a job-posting URL server-side and extracts title/company/location so the
 * "Add job" form can be filled from a pasted link, mirroring the browser extension's
 * extractJobInfo() heuristics (popup.js) — that version reads the DOM of a tab the
 * user already has open, so it never needs a network fetch; this one does, which is
 * exactly what makes it security-sensitive: it's the backend making an HTTP request
 * to a URL the user controls. Every fetch (including redirect hops) is validated
 * against a private/loopback/link-local IP blocklist before it's followed. */
@Service
@Slf4j
public class JobExtractionService {

    private static final int MAX_REDIRECTS = 3;
    private static final int TIMEOUT_SECONDS = 5;
    private static final long MAX_BODY_BYTES = 2_000_000; // 2MB — a job-posting page, not a video
    private static final String USER_AGENT = "CareerOS-JobLinkPreview/1.0 (+https://cammino.app)";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(TIMEOUT_SECONDS))
            .followRedirects(HttpClient.Redirect.NEVER) // redirects are re-validated and followed manually below
            .build();

    public JobExtractionResponse extract(String rawUrl) {
        URI uri = parseAndValidate(rawUrl);
        String html = fetch(uri, 0);
        return parse(html, uri.getHost().toLowerCase(Locale.ROOT));
    }

    private URI parseAndValidate(String rawUrl) {
        URI uri;
        try {
            uri = new URI(rawUrl);
        } catch (URISyntaxException e) {
            throw new BadRequestException("That doesn't look like a valid URL");
        }
        String scheme = uri.getScheme();
        if (uri.getHost() == null || scheme == null || !List.of("http", "https").contains(scheme.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Only http/https URLs are supported");
        }
        assertNotPrivate(uri.getHost());
        return uri;
    }

    // Note: this resolves the hostname once, here, to check it isn't private/internal —
    // but HttpClient resolves it again independently when it actually connects. A very
    // short-TTL DNS record could answer differently between the two lookups (DNS
    // rebinding). Blocking that fully needs a pinned resolver/egress proxy, which is
    // out of scope for this pass — flagging as a known residual risk, not a blind spot.
    private void assertNotPrivate(String host) {
        String lower = host.toLowerCase(Locale.ROOT);
        if (lower.equals("localhost") || lower.equals("0.0.0.0") || lower.endsWith(".local")) {
            throw new BadRequestException("This URL cannot be fetched");
        }
        InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(host);
        } catch (Exception e) {
            throw new BadRequestException("Couldn't resolve this URL");
        }
        for (InetAddress addr : addresses) {
            if (addr.isLoopbackAddress() || addr.isLinkLocalAddress() || addr.isSiteLocalAddress()
                    || addr.isAnyLocalAddress() || addr.isMulticastAddress()) {
                throw new BadRequestException("This URL cannot be fetched");
            }
        }
    }

    private String fetch(URI uri, int redirectCount) {
        if (redirectCount > MAX_REDIRECTS) {
            throw new BadRequestException("Too many redirects");
        }
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(TIMEOUT_SECONDS))
                .header("User-Agent", USER_AGENT)
                .GET()
                .build();
        HttpResponse<byte[]> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
        } catch (IOException | InterruptedException e) {
            throw new BadRequestException("Couldn't reach that URL");
        }
        int status = response.statusCode();
        if (status >= 300 && status < 400) {
            String location = response.headers().firstValue("Location")
                    .orElseThrow(() -> new BadRequestException("Couldn't reach that URL"));
            URI redirectUri = parseAndValidate(uri.resolve(location).toString());
            return fetch(redirectUri, redirectCount + 1);
        }
        if (status != 200) {
            throw new BadRequestException("Couldn't reach that URL (status " + status + ")");
        }
        byte[] body = response.body();
        if (body.length > MAX_BODY_BYTES) {
            body = Arrays.copyOf(body, (int) MAX_BODY_BYTES);
        }
        return new String(body, StandardCharsets.UTF_8);
    }

    private JobExtractionResponse parse(String html, String host) {
        Document doc = Jsoup.parse(html);
        String jobTitle = "", company = "", location = "";

        if (host.contains("linkedin.com")) {
            jobTitle = firstText(doc, "h1.top-card-layout__title", ".job-details-jobs-unified-top-card__job-title h1", "h1");
            company = firstText(doc, ".topcard__org-name-link", ".job-details-jobs-unified-top-card__company-name a", ".job-details-jobs-unified-top-card__company-name");
            location = firstText(doc, ".topcard__flavor--bullet", ".job-details-jobs-unified-top-card__primary-description-container .tvm__text");
        } else if (host.contains("indeed.com")) {
            jobTitle = firstText(doc, "h1.jobsearch-JobInfoHeader-title", "h1");
            company = firstText(doc, "[data-testid=inline-company-name]", ".jobsearch-InlineCompanyRating div");
            location = firstText(doc, "[data-testid=inline-job-location]");
        } else if (host.contains("greenhouse.io")) {
            jobTitle = firstText(doc, "h1.app-title", "h1");
            company = firstText(doc, ".company-name");
        } else if (host.contains("lever.co")) {
            jobTitle = firstText(doc, ".posting-headline h2", "h2");
        }

        if (jobTitle.isBlank()) {
            jobTitle = firstText(doc, "h1");
        }
        if (jobTitle.isBlank()) {
            jobTitle = doc.title().split("[-|]")[0].trim();
        }
        if (company.isBlank()) {
            String og = doc.select("meta[property=og:site_name]").attr("content");
            if (!og.isBlank()) {
                company = og;
            } else {
                String[] parts = doc.title().split("[-|]");
                company = parts.length > 1 ? parts[1].trim() : "";
            }
        }

        return new JobExtractionResponse(truncate(jobTitle, 255), truncate(company, 255), truncate(location, 255));
    }

    private String firstText(Document doc, String... selectors) {
        for (String sel : selectors) {
            Element el = doc.select(sel).first();
            if (el != null) {
                String text = el.text().trim().replaceAll("\\s+", " ");
                if (!text.isBlank()) return text;
            }
        }
        return "";
    }

    private String truncate(String s, int max) {
        return s == null ? "" : (s.length() > max ? s.substring(0, max) : s);
    }
}
