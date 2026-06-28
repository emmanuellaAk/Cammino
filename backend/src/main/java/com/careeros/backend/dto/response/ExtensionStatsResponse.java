package com.careeros.backend.dto.response;

import java.util.Map;

public record ExtensionStatsResponse(
        long totalJobs,
        Map<String, Long> byStatus,
        long unreadNotifications
) {}
