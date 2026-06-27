package com.careeros.backend.dto.response;

import com.careeros.backend.entity.ResumeAnalysis;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ResumeAnalysisResponse(
        UUID id,
        UUID resumeId,
        List<String> skills,
        Integer experienceYears,
        String education,
        List<String> strengths,
        String summary,
        LocalDateTime analyzedAt
) {
    public static ResumeAnalysisResponse from(ResumeAnalysis analysis) {
        return new ResumeAnalysisResponse(
                analysis.getId(),
                analysis.getResume().getId(),
                analysis.getSkills(),
                analysis.getExperienceYears(),
                analysis.getEducation(),
                analysis.getStrengths(),
                analysis.getSummary(),
                analysis.getAnalyzedAt()
        );
    }
}
