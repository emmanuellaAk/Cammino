package com.careeros.backend.repository;

import com.careeros.backend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID>, JpaSpecificationExecutor<Job> {

    // @SQLRestriction on Job filters deleted_at IS NULL automatically for all JPQL queries
    Optional<Job> findByIdAndUserId(UUID id, UUID userId);

    // Native query bypasses @SQLRestriction — needed for cleanup
    @Modifying
    @Query(value = "DELETE FROM jobs WHERE deleted_at IS NOT NULL AND deleted_at < :cutoff", nativeQuery = true)
    void purgeOldDeleted(LocalDateTime cutoff);
}
