package com.careeros.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record QuickSaveJobRequest(
        @NotBlank @Size(max = 255) String jobTitle,
        @NotBlank @Size(max = 255) String company,
        @Size(max = 255) String location,
        @Size(max = 2048) String jobUrl,
        String description,
        @Size(max = 100) String source
) {}
