package com.careeros.backend.dto.response;

import com.careeros.backend.entity.ApplicationNote;

import java.time.LocalDateTime;
import java.util.UUID;

public record ApplicationNoteResponse(
        UUID id,
        String content,
        LocalDateTime createdAt
) {
    public static ApplicationNoteResponse from(ApplicationNote note) {
        return new ApplicationNoteResponse(note.getId(), note.getContent(), note.getCreatedAt());
    }
}
