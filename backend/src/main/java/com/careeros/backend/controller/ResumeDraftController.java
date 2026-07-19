package com.careeros.backend.controller;

import com.careeros.backend.dto.request.CreateResumeDraftRequest;
import com.careeros.backend.dto.request.ResumeDraftChatRequest;
import com.careeros.backend.dto.request.UpdateResumeDraftRequest;
import com.careeros.backend.dto.response.*;
import com.careeros.backend.service.ResumeDraftService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resume-drafts")
@RequiredArgsConstructor
@Tag(name = "Resume Builder")
@SecurityRequirement(name = "bearerAuth")
public class ResumeDraftController {

    private final ResumeDraftService resumeDraftService;

    @GetMapping
    @Operation(summary = "List all resume drafts for the current user")
    ResponseEntity<ApiResponse<List<ResumeDraftResponse>>> list() {
        return ResponseEntity.ok(resumeDraftService.list());
    }

    @PostMapping
    @Operation(summary = "Create a new resume draft from a starter template")
    ResponseEntity<ApiResponse<ResumeDraftResponse>> create(@Valid @RequestBody CreateResumeDraftRequest request) {
        return ResponseEntity.status(201).body(resumeDraftService.create(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a resume draft")
    ResponseEntity<ApiResponse<ResumeDraftResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(resumeDraftService.get(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Save manual edits to a resume draft")
    ResponseEntity<ApiResponse<ResumeDraftResponse>> update(
            @PathVariable UUID id, @Valid @RequestBody UpdateResumeDraftRequest request
    ) {
        return ResponseEntity.ok(resumeDraftService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a resume draft")
    ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        return ResponseEntity.ok(resumeDraftService.delete(id));
    }

    @GetMapping("/{id}/messages")
    @Operation(summary = "Get the chat history for a resume draft")
    ResponseEntity<ApiResponse<List<ResumeDraftMessageResponse>>> listMessages(@PathVariable UUID id) {
        return ResponseEntity.ok(resumeDraftService.listMessages(id));
    }

    @PostMapping("/{id}/chat")
    @Operation(summary = "Send a chat instruction that edits the draft via AI")
    ResponseEntity<ApiResponse<ResumeDraftChatResponse>> chat(
            @PathVariable UUID id, @Valid @RequestBody ResumeDraftChatRequest request
    ) {
        return ResponseEntity.ok(resumeDraftService.chat(id, request));
    }
}
