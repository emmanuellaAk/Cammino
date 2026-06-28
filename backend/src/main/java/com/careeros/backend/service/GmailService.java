package com.careeros.backend.service;

import com.careeros.backend.config.GoogleOAuthProperties;
import com.careeros.backend.dto.gmail.*;
import com.careeros.backend.dto.response.ApiResponse;
import com.careeros.backend.dto.response.EmailScanResultResponse;
import com.careeros.backend.dto.response.GmailConnectionResponse;
import com.careeros.backend.entity.*;
import com.careeros.backend.exception.BadRequestException;
import com.careeros.backend.repository.*;
import com.careeros.backend.security.JwtUtil;
import com.careeros.backend.util.SecurityUtil;
import com.careeros.backend.util.TokenEncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GmailService {

    private static final String GMAIL_API   = "https://www.googleapis.com/gmail/v1/users/me";
    private static final String OAUTH_TOKEN = "https://oauth2.googleapis.com/token";
    private static final String OAUTH_REVOKE = "https://oauth2.googleapis.com/revoke";
    private static final int    MAX_MESSAGES = 25;

    private static final Map<ApplicationStatus, List<String>> STATUS_KEYWORDS = Map.of(
            ApplicationStatus.OFFER, List.of(
                    "offer letter", "pleased to offer", "we would like to offer",
                    "job offer", "compensation package", "we are delighted to offer"),
            ApplicationStatus.INTERVIEW, List.of(
                    "interview", "schedule a call", "phone screen", "next steps",
                    "meet with", "video call", "virtual interview", "hiring manager"),
            ApplicationStatus.ASSESSMENT, List.of(
                    "coding challenge", "technical assessment", "take-home", "skills assessment",
                    "technical test", "code challenge", "online assessment"),
            ApplicationStatus.REJECTED, List.of(
                    "not moving forward", "not selected", "unsuccessful", "regret to inform",
                    "unfortunately", "other candidates", "position has been filled",
                    "not be moving forward", "will not be proceeding")
    );

    private final GmailConnectionRepository connectionRepository;
    private final EmailScanResultRepository  scanResultRepository;
    private final JobRepository              jobRepository;
    private final UserRepository             userRepository;
    private final TokenEncryptionUtil        encryptionUtil;
    private final JwtUtil                    jwtUtil;
    private final GoogleOAuthProperties      googleProps;
    private final NotificationService        notificationService;

    private final RestClient restClient = RestClient.create();

    // ─── OAuth Flow ──────────────────────────────────────────────────────────

    public ApiResponse<Map<String, String>> getAuthorizationUrl() {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        String state = jwtUtil.generateOAuthState(userId);

        String url = UriComponentsBuilder
                .fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id",     googleProps.clientId())
                .queryParam("redirect_uri",  googleProps.redirectUri())
                .queryParam("response_type", "code")
                .queryParam("scope",         "https://www.googleapis.com/auth/gmail.readonly openid email")
                .queryParam("access_type",   "offline")
                .queryParam("prompt",        "consent")
                .queryParam("state",         state)
                .toUriString();

        return ApiResponse.success(Map.of("authorizationUrl", url));
    }

    @Transactional
    public String handleCallback(String code, String state) {
        UUID userId = jwtUtil.validateOAuthState(state);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        GoogleTokenResponse tokens = exchangeCodeForTokens(code);
        String gmailAddress = fetchGmailAddress(tokens.accessToken());
        LocalDateTime expiry = LocalDateTime.now().plusSeconds(tokens.expiresIn());

        GmailConnection connection = connectionRepository.findByUserId(userId)
                .orElse(GmailConnection.builder().user(user).build());
        connection.setGmailAddress(gmailAddress);
        connection.setAccessTokenEnc(encryptionUtil.encrypt(tokens.accessToken()));
        if (tokens.refreshToken() != null) {
            connection.setRefreshTokenEnc(encryptionUtil.encrypt(tokens.refreshToken()));
        }
        connection.setTokenExpiry(expiry);
        connection.setScopes("gmail.readonly");
        connectionRepository.save(connection);

        log.info("Gmail connected for user {}: {}", userId, gmailAddress);
        return googleProps.frontendUrl() + "/settings?gmail=connected";
    }

    // ─── Connection Status ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ApiResponse<GmailConnectionResponse> getConnection() {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        return connectionRepository.findByUserId(userId)
                .map(conn -> ApiResponse.success(GmailConnectionResponse.connected(conn)))
                .orElse(ApiResponse.success(GmailConnectionResponse.disconnected()));
    }

    @Transactional
    public ApiResponse<Void> disconnect() {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        GmailConnection connection = connectionRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Gmail is not connected"));

        try {
            String refreshToken = encryptionUtil.decrypt(connection.getRefreshTokenEnc());
            restClient.post()
                    .uri(OAUTH_REVOKE + "?token=" + refreshToken)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Failed to revoke Google token (continuing with local disconnect): {}", e.getMessage());
        }

        connectionRepository.delete(connection);
        log.info("Gmail disconnected for user {}", userId);
        return ApiResponse.success("Gmail account disconnected");
    }

    // ─── Email Scan ──────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<List<EmailScanResultResponse>> scanEmails() {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        GmailConnection connection = connectionRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Gmail not connected. Please connect your Gmail account first."));

        List<EmailScanResult> results = runScan(connection);

        return ApiResponse.success(
                "Scan complete — found " + results.size() + " new match(es)",
                results.stream().map(EmailScanResultResponse::from).toList());
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<EmailScanResultResponse>> getScanHistory(int page, int size) {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        return ApiResponse.success(
                scanResultRepository
                        .findAllByUserIdOrderByScannedAtDesc(userId, PageRequest.of(page, Math.min(size, 50)))
                        .map(EmailScanResultResponse::from)
                        .getContent());
    }

    @Scheduled(cron = "0 0 6 * * *")
    public void scheduledScan() {
        List<GmailConnection> connections = connectionRepository.findAll();
        log.info("Running scheduled Gmail scan for {} connected accounts", connections.size());
        connections.forEach(conn -> {
            try {
                runScanTransactional(conn);
            } catch (Exception e) {
                log.error("Scheduled scan failed for user {}: {}", conn.getUser().getId(), e.getMessage());
            }
        });
    }

    @Transactional
    public void runScanTransactional(GmailConnection connection) {
        runScan(connection);
    }

    // ─── Core Scan Logic ─────────────────────────────────────────────────────

    private List<EmailScanResult> runScan(GmailConnection connection) {
        UUID userId = connection.getUser().getId();
        String accessToken = getValidAccessToken(connection);

        List<Job> jobs = jobRepository.findAllByUserId(userId);
        if (jobs.isEmpty()) return List.of();

        List<ParsedEmail> emails = fetchJobRelatedEmails(accessToken);
        List<EmailScanResult> saved = new ArrayList<>();

        for (ParsedEmail email : emails) {
            if (scanResultRepository.existsByUserIdAndGmailMessageId(userId, email.id())) continue;

            ApplicationStatus inferredStatus = inferStatus(email.subject(), email.snippet());
            if (inferredStatus == null) continue;

            Job matchedJob = findMatchingJob(email, jobs);
            ScanConfidence confidence = calculateConfidence(email, matchedJob, inferredStatus);

            EmailScanResult result = EmailScanResult.builder()
                    .user(connection.getUser())
                    .job(matchedJob)
                    .gmailMessageId(email.id())
                    .subject(email.subject())
                    .fromAddress(email.from())
                    .receivedAt(email.receivedAt())
                    .inferredStatus(inferredStatus)
                    .confidence(confidence)
                    .build();

            if (confidence == ScanConfidence.HIGH && matchedJob != null) {
                matchedJob.setStatus(inferredStatus);
                jobRepository.save(matchedJob);
                result.setStatusApplied(true);
                log.info("Auto-applied status {} to job {} based on email '{}'",
                        inferredStatus, matchedJob.getId(), email.subject());
                notificationService.createNotification(
                        connection.getUser(),
                        com.careeros.backend.entity.NotificationType.STATUS_CHANGE,
                        "Status updated: " + matchedJob.getJobTitle(),
                        "Your application at " + matchedJob.getCompany()
                                + " was automatically updated to " + inferredStatus.name()
                                + " based on a recent email.",
                        matchedJob.getId());
            }

            saved.add(scanResultRepository.save(result));
        }

        connection.setLastSyncAt(LocalDateTime.now());
        connectionRepository.save(connection);
        return saved;
    }

    // ─── Gmail API Calls ─────────────────────────────────────────────────────

    private GoogleTokenResponse exchangeCodeForTokens(String code) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code",          code);
        body.add("client_id",     googleProps.clientId());
        body.add("client_secret", googleProps.clientSecret());
        body.add("redirect_uri",  googleProps.redirectUri());
        body.add("grant_type",    "authorization_code");

        return restClient.post()
                .uri(OAUTH_TOKEN)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(body)
                .retrieve()
                .body(GoogleTokenResponse.class);
    }

    private GoogleTokenResponse refreshAccessToken(String refreshToken) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("refresh_token", refreshToken);
        body.add("client_id",     googleProps.clientId());
        body.add("client_secret", googleProps.clientSecret());
        body.add("grant_type",    "refresh_token");

        return restClient.post()
                .uri(OAUTH_TOKEN)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(body)
                .retrieve()
                .body(GoogleTokenResponse.class);
    }

    private String fetchGmailAddress(String accessToken) {
        GmailProfile profile = restClient.get()
                .uri(GMAIL_API + "/profile")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(GmailProfile.class);
        return profile != null ? profile.emailAddress() : "unknown";
    }

    private List<ParsedEmail> fetchJobRelatedEmails(String accessToken) {
        String query = "(subject:interview OR subject:offer OR subject:assessment " +
                "OR subject:rejected OR subject:unfortunately OR subject:\"next steps\" " +
                "OR subject:\"moving forward\" OR subject:\"position\") newer_than:30d";

        GmailMessageListResponse listResponse = restClient.get()
                .uri(GMAIL_API + "/messages?q={q}&maxResults={max}",
                        Map.of("q", query, "max", MAX_MESSAGES))
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(GmailMessageListResponse.class);

        if (listResponse == null || listResponse.messages() == null) return List.of();

        List<ParsedEmail> results = new ArrayList<>();
        for (GmailMessageListResponse.MessageRef ref : listResponse.messages()) {
            try {
                GmailMessageDetail detail = restClient.get()
                        .uri(GMAIL_API + "/messages/{id}?format=metadata&metadataHeaders=From,Subject,Date",
                                Map.of("id", ref.id()))
                        .header("Authorization", "Bearer " + accessToken)
                        .retrieve()
                        .body(GmailMessageDetail.class);

                if (detail != null) {
                    results.add(parseMessage(detail));
                }
            } catch (Exception e) {
                log.debug("Could not fetch Gmail message {}: {}", ref.id(), e.getMessage());
            }
        }
        return results;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String getValidAccessToken(GmailConnection connection) {
        if (LocalDateTime.now().isBefore(connection.getTokenExpiry().minusMinutes(2))) {
            return encryptionUtil.decrypt(connection.getAccessTokenEnc());
        }
        log.debug("Access token expired for user {} — refreshing", connection.getUser().getId());
        String refreshToken = encryptionUtil.decrypt(connection.getRefreshTokenEnc());
        GoogleTokenResponse refreshed = refreshAccessToken(refreshToken);
        connection.setAccessTokenEnc(encryptionUtil.encrypt(refreshed.accessToken()));
        connection.setTokenExpiry(LocalDateTime.now().plusSeconds(refreshed.expiresIn()));
        connectionRepository.save(connection);
        return refreshed.accessToken();
    }

    private ParsedEmail parseMessage(GmailMessageDetail detail) {
        Map<String, String> headers = detail.payload().headers().stream()
                .collect(Collectors.toMap(
                        h -> h.name().toLowerCase(),
                        GmailMessageDetail.Header::value,
                        (a, b) -> a));

        LocalDateTime receivedAt = detail.internalDate() != null
                ? LocalDateTime.ofInstant(Instant.ofEpochMilli(detail.internalDate()), ZoneId.systemDefault())
                : null;

        return new ParsedEmail(
                detail.id(),
                headers.get("from"),
                headers.get("subject"),
                detail.snippet(),
                receivedAt
        );
    }

    private ApplicationStatus inferStatus(String subject, String snippet) {
        String text = ((subject != null ? subject : "") + " " + (snippet != null ? snippet : "")).toLowerCase();
        for (Map.Entry<ApplicationStatus, List<String>> entry : STATUS_KEYWORDS.entrySet()) {
            if (entry.getValue().stream().anyMatch(text::contains)) {
                return entry.getKey();
            }
        }
        return null;
    }

    private Job findMatchingJob(ParsedEmail email, List<Job> jobs) {
        String senderDomain = extractDomain(email.from());
        String text = ((email.subject() != null ? email.subject() : "") + " " +
                       (email.from()    != null ? email.from()    : "")).toLowerCase();

        return jobs.stream()
                .filter(job -> {
                    String company = job.getCompany().toLowerCase().trim();
                    String companyKey = company.replaceAll("[^a-z0-9]", "");
                    if (companyKey.length() < 3) return text.contains(company);
                    // domain match or text contains company name
                    boolean domainMatch = senderDomain != null &&
                            senderDomain.contains(companyKey.substring(0, Math.min(5, companyKey.length())));
                    boolean textMatch = text.contains(company);
                    return domainMatch || textMatch;
                })
                .findFirst()
                .orElse(null);
    }

    private ScanConfidence calculateConfidence(ParsedEmail email, Job job, ApplicationStatus status) {
        if (job == null) return ScanConfidence.LOW;

        int signals = 0;
        String company = job.getCompany().toLowerCase();
        String senderDomain = extractDomain(email.from());
        String companyKey = company.replaceAll("[^a-z0-9]", "");

        // Company name in subject
        if (email.subject() != null && email.subject().toLowerCase().contains(company)) signals++;

        // Company matched via domain
        if (senderDomain != null && companyKey.length() >= 3 &&
                senderDomain.contains(companyKey.substring(0, Math.min(5, companyKey.length())))) signals++;

        // Multiple status keywords present
        String text = ((email.subject() != null ? email.subject() : "") + " " +
                       (email.snippet() != null ? email.snippet() : "")).toLowerCase();
        long kwCount = STATUS_KEYWORDS.getOrDefault(status, List.of()).stream()
                .filter(text::contains).count();
        if (kwCount >= 2) signals++;

        if (signals >= 2) return ScanConfidence.HIGH;
        if (signals >= 1) return ScanConfidence.MEDIUM;
        return ScanConfidence.LOW;
    }

    private String extractDomain(String fromHeader) {
        if (fromHeader == null) return null;
        int atIdx = fromHeader.lastIndexOf('@');
        if (atIdx < 0) return null;
        String rest = fromHeader.substring(atIdx + 1);
        int closeIdx = rest.indexOf('>');
        return (closeIdx >= 0 ? rest.substring(0, closeIdx) : rest).toLowerCase().trim();
    }

    private record ParsedEmail(String id, String from, String subject, String snippet, LocalDateTime receivedAt) {}
}
