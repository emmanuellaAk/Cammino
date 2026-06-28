package com.careeros.backend.repository;

import com.careeros.backend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.careeros.backend.entity.ApplicationStatus;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID>, JpaSpecificationExecutor<Job> {

    // @SQLRestriction on Job filters deleted_at IS NULL automatically for all JPQL queries
    Optional<Job> findByIdAndUserId(UUID id, UUID userId);

    List<Job> findAllByUserId(UUID userId);

    Optional<Job> findByJobUrlAndUserId(String jobUrl, UUID userId);

    List<Job> findTop10ByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT j.status, COUNT(j) FROM Job j WHERE j.user.id = :userId GROUP BY j.status")
    List<Object[]> countByStatus(@Param("userId") UUID userId);

    @Query("SELECT j FROM Job j WHERE j.user.id = :userId " +
           "AND j.deadline IS NOT NULL " +
           "AND j.deadline BETWEEN :from AND :to " +
           "AND j.status NOT IN :excluded")
    List<Job> findJobsWithDeadlineBetween(@Param("userId") UUID userId,
                                          @Param("from")   LocalDate from,
                                          @Param("to")     LocalDate to,
                                          @Param("excluded") Collection<ApplicationStatus> excluded);

    @Query("SELECT j FROM Job j WHERE j.user.id = :userId " +
           "AND j.status = com.careeros.backend.entity.ApplicationStatus.APPLIED " +
           "AND j.appliedAt IS NOT NULL AND j.appliedAt < :cutoff")
    List<Job> findStaleAppliedJobs(@Param("userId") UUID userId,
                                   @Param("cutoff") LocalDate cutoff);

    // Native query bypasses @SQLRestriction — needed for cleanup
    @Modifying
    @Query(value = "DELETE FROM jobs WHERE deleted_at IS NOT NULL AND deleted_at < :cutoff", nativeQuery = true)
    void purgeOldDeleted(LocalDateTime cutoff);
}
