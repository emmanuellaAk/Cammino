package com.careeros.backend.dto.response;

public record SourcePerformanceResponse(
        String source,
        long   total,
        long   interviews,
        long   offers,
        double interviewRate,
        double offerRate
) {}
