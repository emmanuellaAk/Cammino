package com.careeros.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateResumeDraftRequest(
        @NotBlank @Size(max = 200) String title
) {}
