package com.careeros.backend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AiResumeRequest(
        @JsonProperty("resume_content") String resumeContent,
        @JsonProperty("mime_type") String mimeType
) {}
