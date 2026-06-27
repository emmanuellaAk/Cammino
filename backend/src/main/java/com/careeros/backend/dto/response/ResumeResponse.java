package com.careeros.backend.dto.response;

import com.careeros.backend.entity.Resume;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ResumeResponse(
        UUID id,
        String originalFileName,
        long fileSize,
        String mimeType,
        boolean active,
        LocalDateTime uploadedAt
) {
    public static ResumeResponse from(Resume resume) {
        return new ResumeResponse(
                resume.getId(),
                resume.getOriginalFileName(),
                resume.getFileSize(),
                resume.getMimeType(),
                resume.isActive(),
                resume.getUploadedAt()
        );
    }
}
