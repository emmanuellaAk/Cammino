package com.careeros.backend.repository;

import com.careeros.backend.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResumeRepository extends JpaRepository<Resume, UUID> {

    List<Resume> findAllByUserIdOrderByUploadedAtDesc(UUID userId);

    Optional<Resume> findByIdAndUserId(UUID id, UUID userId);

    Optional<Resume> findByUserIdAndActiveTrue(UUID userId);

    int countByUserId(UUID userId);

    @Modifying
    @Query("UPDATE Resume r SET r.active = false WHERE r.user.id = :userId")
    void deactivateAllByUserId(UUID userId);
}
