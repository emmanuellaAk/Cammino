package com.careeros.backend.dto.response;

import com.careeros.backend.entity.ApplicationStatus;
import com.careeros.backend.entity.Job;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record JobResponse(
        UUID id,
        String jobTitle,
        String company,
        String location,
        String jobUrl,
        String description,
        String salary,
        ApplicationStatus status,
        LocalDate deadline,
        LocalDate appliedAt,
        String source,
        int notesCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static JobResponse from(Job job) {
        return new JobResponse(
                job.getId(),
                job.getJobTitle(),
                job.getCompany(),
                job.getLocation(),
                job.getJobUrl(),
                job.getDescription(),
                job.getSalary(),
                job.getStatus(),
                job.getDeadline(),
                job.getAppliedAt(),
                job.getSource(),
                job.getNotes().size(),
                job.getCreatedAt(),
                job.getUpdatedAt()
        );
    }
}
