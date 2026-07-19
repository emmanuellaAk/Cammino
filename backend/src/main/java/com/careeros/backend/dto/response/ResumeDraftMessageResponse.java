package com.careeros.backend.dto.response;

import com.careeros.backend.entity.ChatRole;
import com.careeros.backend.entity.ResumeDraftMessage;

import java.time.LocalDateTime;
import java.util.UUID;

public record ResumeDraftMessageResponse(
        UUID id,
        ChatRole role,
        String content,
        LocalDateTime createdAt
) {
    public static ResumeDraftMessageResponse from(ResumeDraftMessage m) {
        return new ResumeDraftMessageResponse(m.getId(), m.getRole(), m.getContent(), m.getCreatedAt());
    }
}
