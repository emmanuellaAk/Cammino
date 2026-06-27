package com.careeros.backend.service;

import com.careeros.backend.dto.request.*;
import com.careeros.backend.dto.response.*;
import com.careeros.backend.entity.*;
import com.careeros.backend.exception.ResourceNotFoundException;
import com.careeros.backend.repository.*;
import com.careeros.backend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final JobRepository jobRepository;
    private final ApplicationNoteRepository noteRepository;

    // ─── Create ──────────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<JobResponse> createJob(CreateJobRequest request) {
        User user = SecurityUtil.getCurrentUser();

        Job job = Job.builder()
                .user(user)
                .jobTitle(request.getJobTitle().trim())
                .company(request.getCompany().trim())
                .location(request.getLocation())
                .jobUrl(request.getJobUrl())
                .description(request.getDescription())
                .salary(request.getSalary())
                .status(request.getStatus() != null ? request.getStatus() : ApplicationStatus.SAVED)
                .deadline(request.getDeadline())
                .appliedAt(request.getAppliedAt())
                .source(request.getSource())
                .build();

        jobRepository.save(job);
        log.info("Job created for user {}: {} @ {}", user.getId(), job.getJobTitle(), job.getCompany());
        return ApiResponse.success("Job saved", JobResponse.from(job));
    }

    // ─── List (paginated + filtered) ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public ApiResponse<PageResponse<JobResponse>> listJobs(
            ApplicationStatus status,
            String company,
            String search,
            Pageable pageable
    ) {
        UUID userId = SecurityUtil.getCurrentUser().getId();

        Specification<Job> spec = Specification.allOf(
                JobSpecification.belongsTo(userId),
                JobSpecification.withStatus(status),
                JobSpecification.withCompany(company),
                JobSpecification.withSearch(search)
        );

        Page<JobResponse> page = jobRepository.findAll(spec, pageable)
                .map(JobResponse::from);

        return ApiResponse.success(PageResponse.from(page));
    }

    // ─── Get ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ApiResponse<JobResponse> getJob(UUID id) {
        Job job = findOwned(id);
        return ApiResponse.success(JobResponse.from(job));
    }

    // ─── Update ──────────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<JobResponse> updateJob(UUID id, UpdateJobRequest request) {
        Job job = findOwned(id);

        if (request.getJobTitle() != null)   job.setJobTitle(request.getJobTitle().trim());
        if (request.getCompany() != null)    job.setCompany(request.getCompany().trim());
        if (request.getLocation() != null)   job.setLocation(request.getLocation());
        if (request.getJobUrl() != null)     job.setJobUrl(request.getJobUrl());
        if (request.getDescription() != null) job.setDescription(request.getDescription());
        if (request.getSalary() != null)     job.setSalary(request.getSalary());
        if (request.getStatus() != null)     job.setStatus(request.getStatus());
        if (request.getDeadline() != null)   job.setDeadline(request.getDeadline());
        if (request.getAppliedAt() != null)  job.setAppliedAt(request.getAppliedAt());
        if (request.getSource() != null)     job.setSource(request.getSource());

        jobRepository.save(job);
        return ApiResponse.success("Job updated", JobResponse.from(job));
    }

    // ─── Delete (soft) ───────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<Void> deleteJob(UUID id) {
        Job job = findOwned(id);
        job.softDelete();
        jobRepository.save(job);
        log.info("Job soft-deleted: {}", id);
        return ApiResponse.success("Job deleted");
    }

    // ─── Update status ────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<JobResponse> updateStatus(UUID id, UpdateStatusRequest request) {
        Job job = findOwned(id);
        job.setStatus(request.getStatus());

        if (request.getAppliedAt() != null) {
            job.setAppliedAt(request.getAppliedAt());
        }

        jobRepository.save(job);
        return ApiResponse.success("Status updated", JobResponse.from(job));
    }

    // ─── Notes ───────────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<ApplicationNoteResponse> addNote(UUID jobId, AddNoteRequest request) {
        Job job = findOwned(jobId);

        ApplicationNote note = ApplicationNote.builder()
                .job(job)
                .content(request.getContent().trim())
                .build();

        noteRepository.save(note);
        return ApiResponse.success("Note added", ApplicationNoteResponse.from(note));
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<ApplicationNoteResponse>> listNotes(UUID jobId) {
        findOwned(jobId); // ownership check
        List<ApplicationNoteResponse> notes = noteRepository
                .findAllByJobIdOrderByCreatedAtDesc(jobId)
                .stream()
                .map(ApplicationNoteResponse::from)
                .toList();
        return ApiResponse.success(notes);
    }

    @Transactional
    public ApiResponse<Void> deleteNote(UUID jobId, UUID noteId) {
        findOwned(jobId); // ownership check
        ApplicationNote note = noteRepository.findByIdAndJobId(noteId, jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", noteId));
        noteRepository.delete(note);
        return ApiResponse.success("Note deleted");
    }

    // ─── Scheduled cleanup ────────────────────────────────────────────────────

    @Scheduled(cron = "0 30 3 * * *")
    @Transactional
    public void purgeOldDeleted() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        jobRepository.purgeOldDeleted(cutoff);
        log.debug("Purged soft-deleted jobs older than 30 days");
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    private Job findOwned(UUID id) {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        return jobRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", id));
    }
}
