package com.careeros.backend.dto.response;

public record JobExtractionResponse(
        String jobTitle,
        String company,
        String location
) {}
