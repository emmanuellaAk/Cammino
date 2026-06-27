package com.careeros.backend.repository;

import com.careeros.backend.entity.GmailConnection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GmailConnectionRepository extends JpaRepository<GmailConnection, UUID> {

    Optional<GmailConnection> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);
}
