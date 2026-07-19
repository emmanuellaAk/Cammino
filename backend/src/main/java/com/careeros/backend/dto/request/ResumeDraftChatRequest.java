package com.careeros.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResumeDraftChatRequest(
        @NotBlank @Size(max = 4000) String message
) {}
