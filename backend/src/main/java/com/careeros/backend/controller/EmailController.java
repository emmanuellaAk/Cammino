package com.careeros.backend.controller;

import com.careeros.backend.dto.response.ApiResponse;
import com.careeros.backend.dto.response.EmailScanResultResponse;
import com.careeros.backend.dto.response.GmailConnectionResponse;
import com.careeros.backend.service.GmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@Tag(name = "Email Intelligence")
public class EmailController {

    private final GmailService gmailService;

    @GetMapping("/connect/google")
    @Operation(summary = "Get Google OAuth2 authorization URL")
    @SecurityRequirement(name = "bearerAuth")
    ResponseEntity<ApiResponse<Map<String, String>>> getAuthorizationUrl() {
        return ResponseEntity.ok(gmailService.getAuthorizationUrl());
    }

    @GetMapping("/connect/google/callback")
    @Operation(summary = "Handle Google OAuth2 callback — redirects to frontend")
    ResponseEntity<Void> handleCallback(
            @RequestParam String code,
            @RequestParam String state
    ) {
        String redirectUrl = gmailService.handleCallback(code, state);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(redirectUrl))
                .build();
    }

    @GetMapping("/connection")
    @Operation(summary = "Get Gmail connection status")
    @SecurityRequirement(name = "bearerAuth")
    ResponseEntity<ApiResponse<GmailConnectionResponse>> getConnection() {
        return ResponseEntity.ok(gmailService.getConnection());
    }

    @DeleteMapping("/connection")
    @Operation(summary = "Disconnect Gmail account")
    @SecurityRequirement(name = "bearerAuth")
    ResponseEntity<ApiResponse<Void>> disconnect() {
        return ResponseEntity.ok(gmailService.disconnect());
    }

    @PostMapping("/scan")
    @Operation(summary = "Trigger a Gmail scan for job-related emails")
    @SecurityRequirement(name = "bearerAuth")
    ResponseEntity<ApiResponse<List<EmailScanResultResponse>>> scan() {
        return ResponseEntity.ok(gmailService.scanEmails());
    }

    @GetMapping("/scan/history")
    @Operation(summary = "Get past email scan results (paginated)")
    @SecurityRequirement(name = "bearerAuth")
    ResponseEntity<ApiResponse<List<EmailScanResultResponse>>> scanHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(gmailService.getScanHistory(page, size));
    }
}
