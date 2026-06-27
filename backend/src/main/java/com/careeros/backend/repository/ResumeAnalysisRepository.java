package com.careeros.backend.repository;

import com.careeros.backend.entity.ResumeAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ResumeAnalysisRepository extends JpaRepository<ResumeAnalysis, UUID> {

    Optional<ResumeAnalysis> findByResumeId(UUID resumeId);

    Optional<ResumeAnalysis> findTopByUserIdOrderByAnalyzedAtDesc(UUID userId);

    void deleteByResumeId(UUID resumeId);
}
