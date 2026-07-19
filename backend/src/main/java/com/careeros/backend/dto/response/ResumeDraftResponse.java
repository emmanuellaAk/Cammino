package com.careeros.backend.dto.response;

import com.careeros.backend.entity.ResumeDraft;

import java.time.LocalDateTime;
import java.util.UUID;

public record ResumeDraftResponse(
        UUID id,
        String title,
        String mdxContent,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ResumeDraftResponse from(ResumeDraft draft) {
        return new ResumeDraftResponse(
                draft.getId(),
                draft.getTitle(),
                draft.getMdxContent(),
                draft.getCreatedAt(),
                draft.getUpdatedAt()
        );
    }
}
