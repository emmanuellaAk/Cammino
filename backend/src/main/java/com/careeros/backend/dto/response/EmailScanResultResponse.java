package com.careeros.backend.dto.response;

import com.careeros.backend.entity.ApplicationStatus;
import com.careeros.backend.entity.EmailScanResult;
import com.careeros.backend.entity.ScanConfidence;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record EmailScanResultResponse(
        UUID id,
        UUID jobId,
        String subject,
        String fromAddress,
        LocalDateTime receivedAt,
        ApplicationStatus inferredStatus,
        ScanConfidence confidence,
        boolean statusApplied,
        LocalDateTime scannedAt
) {
    public static EmailScanResultResponse from(EmailScanResult r) {
        return new EmailScanResultResponse(
                r.getId(),
                r.getJob() != null ? r.getJob().getId() : null,
                r.getSubject(),
                r.getFromAddress(),
                r.getReceivedAt(),
                r.getInferredStatus(),
                r.getConfidence(),
                r.isStatusApplied(),
                r.getScannedAt()
        );
    }
}
