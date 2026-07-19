package com.careeros.backend.repository;

import com.careeros.backend.entity.ResumeDraftMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumeDraftMessageRepository extends JpaRepository<ResumeDraftMessage, UUID> {

    List<ResumeDraftMessage> findAllByDraftIdOrderByCreatedAtAsc(UUID draftId);
}
