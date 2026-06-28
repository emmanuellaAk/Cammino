package com.careeros.backend.dto.response;

import com.careeros.backend.entity.ExtensionToken;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ExtensionTokenResponse(
        UUID id,
        String label,
        LocalDateTime createdAt,
        LocalDateTime lastUsedAt,
        LocalDateTime expiresAt
) {
    public static ExtensionTokenResponse from(ExtensionToken t) {
        return new ExtensionTokenResponse(
                t.getId(), t.getLabel(), t.getCreatedAt(), t.getLastUsedAt(), t.getExpiresAt());
    }
}
