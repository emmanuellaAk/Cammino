package com.careeros.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AnalyticsOverviewResponse(
        long  total,
        long  active,
        long  saved,
        long  applied,
        long  inAssessment,
        long  inInterview,
        long  offers,
        long  rejected,
        double responseRate,
        double interviewRate,
        double offerRate,
        Double avgDaysToResponse,
        String topSource
) {}
