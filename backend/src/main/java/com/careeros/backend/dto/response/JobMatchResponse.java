package com.careeros.backend.dto.response;

import com.careeros.backend.entity.JobMatch;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record JobMatchResponse(
        UUID id,
        UUID jobId,
        UUID resumeId,
        Integer matchScore,
        List<String> matchingSkills,
        List<String> missingSkills,
        List<String> recommendations,
        String summary,
        LocalDateTime analyzedAt
) {
    public static JobMatchResponse from(JobMatch match) {
        return new JobMatchResponse(
                match.getId(),
                match.getJob().getId(),
                match.getResume().getId(),
                match.getMatchScore(),
                match.getMatchingSkills(),
                match.getMissingSkills(),
                match.getRecommendations(),
                match.getSummary(),
                match.getAnalyzedAt()
        );
    }
}
