package com.careeros.backend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record AiResumeResponse(
        @JsonProperty("skills") List<String> skills,
        @JsonProperty("experience_years") Integer experienceYears,
        @JsonProperty("education") String education,
        @JsonProperty("strengths") List<String> strengths,
        @JsonProperty("summary") String summary
) {}
