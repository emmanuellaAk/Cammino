package com.careeros.backend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record AiJobMatchResponse(
        @JsonProperty("match_score") Integer matchScore,
        @JsonProperty("matching_skills") List<String> matchingSkills,
        @JsonProperty("missing_skills") List<String> missingSkills,
        @JsonProperty("recommendations") List<String> recommendations,
        @JsonProperty("summary") String summary
) {}
