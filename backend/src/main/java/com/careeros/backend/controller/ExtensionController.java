package com.careeros.backend.controller;

import com.careeros.backend.dto.request.GenerateExtensionTokenRequest;
import com.careeros.backend.dto.request.QuickSaveJobRequest;
import com.careeros.backend.dto.response.*;
import com.careeros.backend.service.ExtensionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/extension")
@RequiredArgsConstructor
@Tag(name = "Browser Extension API")
@SecurityRequirement(name = "bearerAuth")
public class ExtensionController {

    private final ExtensionService extensionService;

    // ─── Token management (requires web JWT auth) ─────────────────────────────

    @PostMapping("/tokens")
    @Operation(summary = "Generate a personal access token for the browser extension")
    ResponseEntity<ApiResponse<GeneratedTokenResponse>> generateToken(
            @Valid @RequestBody GenerateExtensionTokenRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(extensionService.generateToken(request));
    }

    @GetMapping("/tokens")
    @Operation(summary = "List all extension tokens for the current user")
    ResponseEntity<ApiResponse<List<ExtensionTokenResponse>>> listTokens() {
        return ResponseEntity.ok(extensionService.listTokens());
    }

    @DeleteMapping("/tokens/{id}")
    @Operation(summary = "Revoke an extension token")
    ResponseEntity<ApiResponse<Void>> revokeToken(@PathVariable UUID id) {
        return ResponseEntity.ok(extensionService.revokeToken(id));
    }

    // ─── Extension job operations (accepts JWT or PAT) ────────────────────────

    @PostMapping("/jobs/quick-save")
    @Operation(summary = "Save a job directly from the browser extension")
    ResponseEntity<ApiResponse<JobResponse>> quickSave(
            @Valid @RequestBody QuickSaveJobRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(extensionService.quickSave(request));
    }

    @GetMapping("/jobs/check")
    @Operation(summary = "Check whether a job URL is already in the tracker")
    ResponseEntity<ApiResponse<Map<String, Object>>> checkUrl(
            @RequestParam String url
    ) {
        return ResponseEntity.ok(extensionService.checkUrl(url));
    }

    @GetMapping("/jobs/recent")
    @Operation(summary = "Get the 10 most recently saved jobs (for extension popup)")
    ResponseEntity<ApiResponse<List<JobResponse>>> recentJobs() {
        return ResponseEntity.ok(extensionService.getRecentJobs());
    }

    @GetMapping("/stats")
    @Operation(summary = "Get application stats summary (for extension popup badge)")
    ResponseEntity<ApiResponse<ExtensionStatsResponse>> stats() {
        return ResponseEntity.ok(extensionService.getStats());
    }
}
