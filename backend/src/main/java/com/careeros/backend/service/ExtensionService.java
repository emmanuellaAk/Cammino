package com.careeros.backend.service;

import com.careeros.backend.dto.request.GenerateExtensionTokenRequest;
import com.careeros.backend.dto.request.QuickSaveJobRequest;
import com.careeros.backend.dto.response.*;
import com.careeros.backend.entity.*;
import com.careeros.backend.exception.BadRequestException;
import com.careeros.backend.exception.ResourceNotFoundException;
import com.careeros.backend.repository.*;
import com.careeros.backend.util.SecurityUtil;
import com.careeros.backend.util.TokenHashUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.security.SecureRandom;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExtensionService {

    private final ExtensionTokenRepository extensionTokenRepository;
    private final JobRepository            jobRepository;
    private final NotificationRepository   notificationRepository;

    // ─── Token Management ────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<GeneratedTokenResponse> generateToken(GenerateExtensionTokenRequest request) {
        User user = SecurityUtil.getCurrentUser();

        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        String rawToken = HexFormat.of().formatHex(bytes);
        String hash     = TokenHashUtil.sha256(rawToken);

        ExtensionToken token = ExtensionToken.builder()
                .user(user)
                .tokenHash(hash)
                .label(request.label().trim())
                .build();
        extensionTokenRepository.save(token);

        log.info("Extension token generated for user {}: '{}'", user.getId(), token.getLabel());
        return ApiResponse.success(new GeneratedTokenResponse(
                token.getId(),
                rawToken,
                token.getLabel(),
                token.getCreatedAt(),
                "Store this token securely — it will not be shown again."));
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<ExtensionTokenResponse>> listTokens() {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        return ApiResponse.success(
                extensionTokenRepository.findAllByUserId(userId)
                        .stream().map(ExtensionTokenResponse::from).toList());
    }

    @Transactional
    public ApiResponse<Void> revokeToken(UUID tokenId) {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        ExtensionToken token = extensionTokenRepository.findByIdAndUserId(tokenId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Extension token", tokenId));
        extensionTokenRepository.delete(token);
        log.info("Extension token {} revoked by user {}", tokenId, userId);
        return ApiResponse.success("Extension token revoked");
    }

    // ─── Extension Job Operations ─────────────────────────────────────────────

    @Transactional
    public ApiResponse<JobResponse> quickSave(QuickSaveJobRequest request) {
        User user = SecurityUtil.getCurrentUser();

        if (request.jobUrl() != null && !request.jobUrl().isBlank()) {
            validateUrlScheme(request.jobUrl());
            Optional<Job> existing = jobRepository.findByJobUrlAndUserId(request.jobUrl(), user.getId());
            if (existing.isPresent()) {
                return ApiResponse.success("Job already in your tracker", JobResponse.from(existing.get()));
            }
        }

        Job job = Job.builder()
                .user(user)
                .jobTitle(request.jobTitle().trim())
                .company(request.company().trim())
                .location(request.location())
                .jobUrl(request.jobUrl())
                .description(request.description())
                .source(request.source())
                .status(ApplicationStatus.SAVED)
                .build();

        jobRepository.save(job);
        log.info("Job quick-saved via extension for user {}: {} at {}", user.getId(), job.getJobTitle(), job.getCompany());
        return ApiResponse.success("Job saved to your tracker", JobResponse.from(job));
    }

    @Transactional(readOnly = true)
    public ApiResponse<Map<String, Object>> checkUrl(String url) {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        validateUrlScheme(url);
        return jobRepository.findByJobUrlAndUserId(url, userId)
                .<ApiResponse<Map<String, Object>>>map(job -> ApiResponse.success(Map.of(
                        "exists", true,
                        "jobId",  job.getId().toString(),
                        "status", job.getStatus().name())))
                .orElse(ApiResponse.success(Map.of("exists", false)));
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<JobResponse>> getRecentJobs() {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        return ApiResponse.success(
                jobRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId)
                        .stream().map(JobResponse::from).toList());
    }

    private void validateUrlScheme(String url) {
        try {
            String scheme = URI.create(url).getScheme();
            if (!"http".equals(scheme) && !"https".equals(scheme)) {
                throw new BadRequestException("Job URL must use http or https");
            }
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid job URL");
        }
    }

    @Transactional(readOnly = true)
    public ApiResponse<ExtensionStatsResponse> getStats() {
        UUID userId = SecurityUtil.getCurrentUser().getId();

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (ApplicationStatus s : ApplicationStatus.values()) byStatus.put(s.name(), 0L);
        jobRepository.countByStatus(userId)
                .forEach(row -> byStatus.put(((ApplicationStatus) row[0]).name(), (Long) row[1]));

        long total  = byStatus.values().stream().mapToLong(Long::longValue).sum();
        long unread = notificationRepository.countByUserIdAndReadFalse(userId);

        return ApiResponse.success(new ExtensionStatsResponse(total, byStatus, unread));
    }
}
