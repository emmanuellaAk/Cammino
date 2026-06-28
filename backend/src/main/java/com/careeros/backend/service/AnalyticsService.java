package com.careeros.backend.service;

import com.careeros.backend.dto.response.*;
import com.careeros.backend.entity.ApplicationStatus;
import com.careeros.backend.repository.JobRepository;
import com.careeros.backend.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final JobRepository jobRepository;
    private final EntityManager em;

    // ─── Overview ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ApiResponse<AnalyticsOverviewResponse> getOverview() {
        UUID userId = getUserId();
        Map<ApplicationStatus, Long> counts = statusCounts(userId);

        long saved      = counts.getOrDefault(ApplicationStatus.SAVED,       0L);
        long applied    = counts.getOrDefault(ApplicationStatus.APPLIED,      0L);
        long assessment = counts.getOrDefault(ApplicationStatus.ASSESSMENT,   0L);
        long interview  = counts.getOrDefault(ApplicationStatus.INTERVIEW,    0L);
        long offer      = counts.getOrDefault(ApplicationStatus.OFFER,        0L);
        long rejected   = counts.getOrDefault(ApplicationStatus.REJECTED,     0L);
        long total      = saved + applied + assessment + interview + offer + rejected;
        long submitted  = applied + assessment + interview + offer + rejected;
        long active     = total - rejected - offer;

        double responseRate  = submitted > 0 ? round((double)(interview + offer + rejected) / submitted * 100) : 0;
        double interviewRate = submitted > 0 ? round((double)(interview + offer) / submitted * 100) : 0;
        double offerRate     = submitted > 0 ? round((double) offer / submitted * 100) : 0;

        Double avgDays  = avgDaysToResponse(userId);
        String topSrc   = topSource(userId);

        return ApiResponse.success(new AnalyticsOverviewResponse(
                total, active, saved, applied, assessment, interview, offer, rejected,
                responseRate, interviewRate, offerRate,
                avgDays != null ? round(avgDays) : null,
                topSrc));
    }

    // ─── Funnel ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ApiResponse<FunnelResponse> getFunnel() {
        UUID userId = getUserId();
        Map<ApplicationStatus, Long> counts = statusCounts(userId);

        long saved      = counts.getOrDefault(ApplicationStatus.SAVED,       0L);
        long applied    = counts.getOrDefault(ApplicationStatus.APPLIED,      0L);
        long assessment = counts.getOrDefault(ApplicationStatus.ASSESSMENT,   0L);
        long interview  = counts.getOrDefault(ApplicationStatus.INTERVIEW,    0L);
        long offer      = counts.getOrDefault(ApplicationStatus.OFFER,        0L);
        long rejected   = counts.getOrDefault(ApplicationStatus.REJECTED,     0L);
        long submitted  = applied + assessment + interview + offer + rejected;

        double assessmentRate = submitted > 0 ? round((double)(assessment + interview + offer) / submitted * 100) : 0;
        double interviewRate  = submitted > 0 ? round((double)(interview + offer) / submitted * 100) : 0;
        double offerRate      = submitted > 0 ? round((double) offer / submitted * 100) : 0;

        return ApiResponse.success(new FunnelResponse(
                saved, submitted, assessment, interview, offer, rejected,
                assessmentRate, interviewRate, offerRate));
    }

    // ─── Trend ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ApiResponse<List<ApplicationTrendResponse>> getTrend(String period) {
        UUID userId = getUserId();
        boolean monthly = "monthly".equalsIgnoreCase(period);

        String sql = monthly
                ? "SELECT DATE_TRUNC('month', created_at)::date AS p, COUNT(*) AS cnt " +
                  "FROM jobs WHERE user_id = ?1 AND deleted_at IS NULL " +
                  "AND created_at >= NOW() - INTERVAL '12 months' GROUP BY 1 ORDER BY 1"
                : "SELECT DATE_TRUNC('week', created_at)::date AS p, COUNT(*) AS cnt " +
                  "FROM jobs WHERE user_id = ?1 AND deleted_at IS NULL " +
                  "AND created_at >= NOW() - INTERVAL '12 weeks' GROUP BY 1 ORDER BY 1";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).setParameter(1, userId).getResultList();

        List<ApplicationTrendResponse> result = rows.stream().map(row -> {
            var date = ((Date) row[0]).toLocalDate();
            return new ApplicationTrendResponse(date.toString(), date, ((Number) row[1]).longValue());
        }).toList();

        return ApiResponse.success(result);
    }

    // ─── Source Performance ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ApiResponse<List<SourcePerformanceResponse>> getSourcePerformance() {
        UUID userId = getUserId();

        String sql =
                "SELECT COALESCE(source, 'Direct') AS src, " +
                "COUNT(*) AS total, " +
                "COUNT(CASE WHEN status = 'INTERVIEW' THEN 1 END) AS interviews, " +
                "COUNT(CASE WHEN status = 'OFFER'     THEN 1 END) AS offers " +
                "FROM jobs WHERE user_id = ?1 AND deleted_at IS NULL " +
                "GROUP BY 1 ORDER BY total DESC";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).setParameter(1, userId).getResultList();

        List<SourcePerformanceResponse> result = rows.stream().map(row -> {
            String src   = (String) row[0];
            long total   = ((Number) row[1]).longValue();
            long inter   = ((Number) row[2]).longValue();
            long offers  = ((Number) row[3]).longValue();
            return new SourcePerformanceResponse(
                    src, total, inter, offers,
                    total > 0 ? round((double) inter  / total * 100) : 0,
                    total > 0 ? round((double) offers / total * 100) : 0);
        }).toList();

        return ApiResponse.success(result);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Map<ApplicationStatus, Long> statusCounts(UUID userId) {
        return jobRepository.countByStatus(userId).stream()
                .collect(Collectors.toMap(
                        row -> (ApplicationStatus) row[0],
                        row -> (Long) row[1]));
    }

    private Double avgDaysToResponse(UUID userId) {
        String sql =
                "SELECT AVG(EXTRACT(EPOCH FROM (esr.received_at - j.applied_at::timestamp)) / 86400.0) " +
                "FROM email_scan_results esr JOIN jobs j ON esr.job_id = j.id " +
                "WHERE esr.user_id = ?1 AND esr.status_applied = true " +
                "AND j.applied_at IS NOT NULL AND esr.received_at IS NOT NULL";
        Object raw = em.createNativeQuery(sql).setParameter(1, userId).getSingleResult();
        return raw instanceof Number n ? n.doubleValue() : null;
    }

    private String topSource(UUID userId) {
        String sql =
                "SELECT COALESCE(source, 'Direct') FROM jobs " +
                "WHERE user_id = ?1 AND deleted_at IS NULL " +
                "GROUP BY source ORDER BY COUNT(*) DESC LIMIT 1";
        @SuppressWarnings("unchecked")
        List<String> rows = em.createNativeQuery(sql).setParameter(1, userId).getResultList();
        return rows.isEmpty() ? null : rows.get(0);
    }

    private UUID getUserId() {
        return SecurityUtil.getCurrentUser().getId();
    }

    private double round(double val) {
        return Math.round(val * 10.0) / 10.0;
    }
}
