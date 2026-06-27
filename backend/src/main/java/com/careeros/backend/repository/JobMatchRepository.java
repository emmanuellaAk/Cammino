package com.careeros.backend.repository;

import com.careeros.backend.entity.JobMatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface JobMatchRepository extends JpaRepository<JobMatch, UUID> {

    Optional<JobMatch> findByJobIdAndResumeId(UUID jobId, UUID resumeId);

    Optional<JobMatch> findTopByJobIdAndUserIdOrderByAnalyzedAtDesc(UUID jobId, UUID userId);

    void deleteByJobIdAndResumeId(UUID jobId, UUID resumeId);
}
