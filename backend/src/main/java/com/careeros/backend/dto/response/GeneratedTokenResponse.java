package com.careeros.backend.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record GeneratedTokenResponse(
        UUID tokenId,
        String token,
        String label,
        LocalDateTime createdAt,
        String warning
) {}
