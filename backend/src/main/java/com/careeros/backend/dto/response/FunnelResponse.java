package com.careeros.backend.dto.response;

public record FunnelResponse(
        long saved,
        long submitted,       // applied + assessment + interview + offer + rejected
        long inAssessment,
        long inInterview,
        long offers,
        long rejected,
        double assessmentRate,   // reached assessment+ / submitted
        double interviewRate,    // reached interview+ / submitted
        double offerRate         // offer / submitted
) {}
