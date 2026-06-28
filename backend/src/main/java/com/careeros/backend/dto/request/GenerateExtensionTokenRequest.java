package com.careeros.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GenerateExtensionTokenRequest(
        @NotBlank @Size(max = 100) String label
) {}
