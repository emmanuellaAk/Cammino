package com.careeros.backend.controller;

import com.careeros.backend.dto.response.*;
import com.careeros.backend.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics Dashboard")
@SecurityRequirement(name = "bearerAuth")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    @Operation(summary = "Key metrics: totals, rates, avg response time, top source")
    ResponseEntity<ApiResponse<AnalyticsOverviewResponse>> overview() {
        return ResponseEntity.ok(analyticsService.getOverview());
    }

    @GetMapping("/funnel")
    @Operation(summary = "Conversion funnel: saved → submitted → assessment → interview → offer")
    ResponseEntity<ApiResponse<FunnelResponse>> funnel() {
        return ResponseEntity.ok(analyticsService.getFunnel());
    }

    @GetMapping("/trend")
    @Operation(summary = "Applications added over time — period=weekly (default) or monthly")
    ResponseEntity<ApiResponse<List<ApplicationTrendResponse>>> trend(
            @RequestParam(defaultValue = "weekly") String period
    ) {
        return ResponseEntity.ok(analyticsService.getTrend(period));
    }

    @GetMapping("/source-performance")
    @Operation(summary = "Interview and offer rates broken down by job source")
    ResponseEntity<ApiResponse<List<SourcePerformanceResponse>>> sourcePerformance() {
        return ResponseEntity.ok(analyticsService.getSourcePerformance());
    }
}
