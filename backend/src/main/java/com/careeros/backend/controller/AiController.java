package com.careeros.backend.controller;

import com.careeros.backend.dto.response.ApiResponse;
import com.careeros.backend.dto.response.JobMatchResponse;
import com.careeros.backend.dto.response.ResumeAnalysisResponse;
import com.careeros.backend.service.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Integration")
@SecurityRequirement(name = "bearerAuth")
public class AiController {

    private final AiService aiService;

    @PostMapping("/resume/analyze")
    @Operation(summary = "Analyse the active resume using AI (triggers a fresh call to AI service)")
    ResponseEntity<ApiResponse<ResumeAnalysisResponse>> analyzeResume() {
        return ResponseEntity.ok(aiService.analyzeResume());
    }

    @GetMapping("/resume/analysis")
    @Operation(summary = "Get the cached AI analysis for the active resume")
    ResponseEntity<ApiResponse<ResumeAnalysisResponse>> getAnalysis() {
        return ResponseEntity.ok(aiService.getAnalysis());
    }

    @PostMapping("/jobs/{id}/match")
    @Operation(summary = "Match the active resume against a job using AI (triggers a fresh call)")
    ResponseEntity<ApiResponse<JobMatchResponse>> matchJob(@PathVariable UUID id) {
        return ResponseEntity.ok(aiService.matchJob(id));
    }

    @GetMapping("/jobs/{id}/match")
    @Operation(summary = "Get the cached AI match result for a job")
    ResponseEntity<ApiResponse<JobMatchResponse>> getMatch(@PathVariable UUID id) {
        return ResponseEntity.ok(aiService.getMatch(id));
    }
}
