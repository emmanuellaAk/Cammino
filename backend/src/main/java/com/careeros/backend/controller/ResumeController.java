package com.careeros.backend.controller;

import com.careeros.backend.dto.response.ApiResponse;
import com.careeros.backend.dto.response.ResumeResponse;
import com.careeros.backend.service.ResumeService;
import com.careeros.backend.service.ResumeService.FileDownload;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
@Tag(name = "Resumes")
@SecurityRequirement(name = "bearerAuth")
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a resume (PDF or DOCX, max 5 MB)")
    ResponseEntity<ApiResponse<ResumeResponse>> upload(@RequestParam MultipartFile file) {
        return ResponseEntity.status(201).body(resumeService.upload(file));
    }

    @GetMapping
    @Operation(summary = "List all resumes for the current user")
    ResponseEntity<ApiResponse<List<ResumeResponse>>> list() {
        return ResponseEntity.ok(resumeService.listResumes());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get resume metadata")
    ResponseEntity<ApiResponse<ResumeResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(resumeService.getResume(id));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download the resume file")
    ResponseEntity<Resource> download(@PathVariable UUID id) {
        FileDownload dl = resumeService.download(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(dl.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(dl.filename())
                                .build()
                                .toString())
                .body(dl.resource());
    }

    @PutMapping("/{id}/set-active")
    @Operation(summary = "Mark a resume as the active one for AI matching")
    ResponseEntity<ApiResponse<ResumeResponse>> setActive(@PathVariable UUID id) {
        return ResponseEntity.ok(resumeService.setActive(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a resume")
    ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        return ResponseEntity.ok(resumeService.delete(id));
    }
}
