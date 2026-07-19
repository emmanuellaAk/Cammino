package com.careeros.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class RateLimitingFilter implements Filter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final RateLimitProperties props;

    public RateLimitingFilter(ObjectMapper objectMapper, RateLimitProperties props) {
        this.objectMapper = objectMapper;
        this.props = props;
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        if (isRateLimited(request.getRequestURI())) {
            String key = clientKey(request);
            Bucket bucket = buckets.computeIfAbsent(key, k -> newBucket());

            if (!bucket.tryConsume(1)) {
                log.warn("Rate limit exceeded for {}", clientIp(request));
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(objectMapper.writeValueAsString(Map.of(
                        "success", false,
                        "code", "RATE_LIMIT_EXCEEDED",
                        "message", "Too many requests — please try again later."
                )));
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private boolean isRateLimited(String uri) {
        return uri.startsWith("/api/auth/");
    }

    private String clientKey(HttpServletRequest request) {
        return clientIp(request) + ":" + request.getRequestURI();
    }

    private String clientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        String forwarded = request.getHeader("X-Forwarded-For");
        // Only honor X-Forwarded-For when it actually arrived via a trusted reverse
        // proxy — otherwise any client can set this header to a fresh value on every
        // request and get a brand-new rate-limit bucket each time.
        if (forwarded != null && !forwarded.isBlank() && props.getTrustedProxies().contains(remoteAddr)) {
            return forwarded.split(",")[0].trim();
        }
        return remoteAddr;
    }

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(props.getCapacity())
                .refillGreedy(props.getRefillTokens(), Duration.ofMinutes(props.getRefillDurationMinutes()))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }
}
