package com.careeros.backend.repository;

import com.careeros.backend.entity.ResumeDraft;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResumeDraftRepository extends JpaRepository<ResumeDraft, UUID> {

    List<ResumeDraft> findAllByUserIdOrderByUpdatedAtDesc(UUID userId);

    Optional<ResumeDraft> findByIdAndUserId(UUID id, UUID userId);
}
