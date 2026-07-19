package com.careeros.backend.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateResumeDraftRequest(
        @Size(max = 200) String title,
        String mdxContent
) {}
