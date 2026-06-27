package com.careeros.backend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AiJobMatchRequest(
        @JsonProperty("resume_content") String resumeContent,
        @JsonProperty("mime_type") String mimeType,
        @JsonProperty("job_title") String jobTitle,
        @JsonProperty("company") String company,
        @JsonProperty("location") String location,
        @JsonProperty("job_description") String jobDescription
) {}
