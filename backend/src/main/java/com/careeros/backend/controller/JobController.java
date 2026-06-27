package com.careeros.backend.controller;

import com.careeros.backend.dto.request.*;
import com.careeros.backend.dto.response.*;
import com.careeros.backend.entity.ApplicationStatus;
import com.careeros.backend.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Tag(name = "Job Tracker")
@SecurityRequirement(name = "bearerAuth")
public class JobController {

    private final JobService jobService;

    @PostMapping
    @Operation(summary = "Save a job application")
    ResponseEntity<ApiResponse<JobResponse>> create(@Valid @RequestBody CreateJobRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.createJob(request));
    }

    @GetMapping
    @Operation(summary = "List job applications (paginated, filterable)")
    ResponseEntity<ApiResponse<PageResponse<JobResponse>>> list(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), sort);
        return ResponseEntity.ok(jobService.listJobs(status, company, search, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single job application")
    ResponseEntity<ApiResponse<JobResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(jobService.getJob(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a job application")
    ResponseEntity<ApiResponse<JobResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateJobRequest request
    ) {
        return ResponseEntity.ok(jobService.updateJob(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a job application (soft delete, purged after 30 days)")
    ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        return ResponseEntity.ok(jobService.deleteJob(id));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update application status")
    ResponseEntity<ApiResponse<JobResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStatusRequest request
    ) {
        return ResponseEntity.ok(jobService.updateStatus(id, request));
    }

    @PostMapping("/{id}/notes")
    @Operation(summary = "Add a note to a job application")
    ResponseEntity<ApiResponse<ApplicationNoteResponse>> addNote(
            @PathVariable UUID id,
            @Valid @RequestBody AddNoteRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.addNote(id, request));
    }

    @GetMapping("/{id}/notes")
    @Operation(summary = "List all notes for a job application")
    ResponseEntity<ApiResponse<List<ApplicationNoteResponse>>> listNotes(@PathVariable UUID id) {
        return ResponseEntity.ok(jobService.listNotes(id));
    }

    @DeleteMapping("/{id}/notes/{noteId}")
    @Operation(summary = "Delete a note")
    ResponseEntity<ApiResponse<Void>> deleteNote(
            @PathVariable UUID id,
            @PathVariable UUID noteId
    ) {
        return ResponseEntity.ok(jobService.deleteNote(id, noteId));
    }
}
