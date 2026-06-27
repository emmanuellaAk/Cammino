package com.careeros.backend.repository;

import com.careeros.backend.entity.EmailScanResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EmailScanResultRepository extends JpaRepository<EmailScanResult, UUID> {

    Page<EmailScanResult> findAllByUserIdOrderByScannedAtDesc(UUID userId, Pageable pageable);

    boolean existsByUserIdAndGmailMessageId(UUID userId, String gmailMessageId);
}
