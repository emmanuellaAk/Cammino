package com.careeros.backend.repository;

import com.careeros.backend.entity.ApplicationNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationNoteRepository extends JpaRepository<ApplicationNote, UUID> {

    List<ApplicationNote> findAllByJobIdOrderByCreatedAtDesc(UUID jobId);

    Optional<ApplicationNote> findByIdAndJobId(UUID id, UUID jobId);
}
