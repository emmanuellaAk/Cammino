package com.careeros.backend.repository;

import com.careeros.backend.entity.ExtensionToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExtensionTokenRepository extends JpaRepository<ExtensionToken, UUID> {

    @Query("SELECT t FROM ExtensionToken t JOIN FETCH t.user WHERE t.tokenHash = :hash")
    Optional<ExtensionToken> findByTokenHashWithUser(@Param("hash") String hash);

    List<ExtensionToken> findAllByUserId(UUID userId);

    void deleteByIdAndUserId(UUID id, UUID userId);
}
