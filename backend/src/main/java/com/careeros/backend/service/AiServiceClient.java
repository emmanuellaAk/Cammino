package com.careeros.backend.service;

import com.careeros.backend.dto.ai.AiJobMatchRequest;
import com.careeros.backend.dto.ai.AiJobMatchResponse;
import com.careeros.backend.dto.ai.AiResumeEditRequest;
import com.careeros.backend.dto.ai.AiResumeEditResponse;
import com.careeros.backend.dto.ai.AiResumeRequest;
import com.careeros.backend.dto.ai.AiResumeResponse;
import com.careeros.backend.exception.ServiceUnavailableException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiServiceClient {

    private final RestClient aiRestClient;

    @Retry(name = "ai-service")
    @CircuitBreaker(name = "ai-service", fallbackMethod = "resumeAnalysisFallback")
    public AiResumeResponse analyzeResume(AiResumeRequest request) {
        return aiRestClient.post()
                .uri("/analyze-resume")
                .body(request)
                .retrieve()
                .body(AiResumeResponse.class);
    }

    @SuppressWarnings("unused")
    private AiResumeResponse resumeAnalysisFallback(AiResumeRequest request, Throwable t) {
        log.warn("AI service unavailable for resume analysis: {}", t.getMessage());
        throw new ServiceUnavailableException("AI service is temporarily unavailable. Please try again later.");
    }

    @Retry(name = "ai-service")
    @CircuitBreaker(name = "ai-service", fallbackMethod = "jobMatchFallback")
    public AiJobMatchResponse matchJob(AiJobMatchRequest request) {
        return aiRestClient.post()
                .uri("/match-job")
                .body(request)
                .retrieve()
                .body(AiJobMatchResponse.class);
    }

    @SuppressWarnings("unused")
    private AiJobMatchResponse jobMatchFallback(AiJobMatchRequest request, Throwable t) {
        log.warn("AI service unavailable for job matching: {}", t.getMessage());
        throw new ServiceUnavailableException("AI service is temporarily unavailable. Please try again later.");
    }

    @Retry(name = "ai-service")
    @CircuitBreaker(name = "ai-service", fallbackMethod = "resumeEditFallback")
    public AiResumeEditResponse editResume(AiResumeEditRequest request) {
        return aiRestClient.post()
                .uri("/resume/edit")
                .body(request)
                .retrieve()
                .body(AiResumeEditResponse.class);
    }

    @SuppressWarnings("unused")
    private AiResumeEditResponse resumeEditFallback(AiResumeEditRequest request, Throwable t) {
        log.warn("AI service unavailable for resume editing: {}", t.getMessage());
        throw new ServiceUnavailableException("AI service is temporarily unavailable. Please try again later.");
    }
}
