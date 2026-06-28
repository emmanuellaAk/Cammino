package com.careeros.backend.repository;

import com.careeros.backend.entity.Notification;
import com.careeros.backend.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findAllByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<Notification> findAllByUserIdAndReadFalseOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByUserIdAndReadFalse(UUID userId);

    boolean existsByUserIdAndTypeAndRelatedJobIdAndCreatedAtAfter(
            UUID userId, NotificationType type, UUID relatedJobId, LocalDateTime after);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true, n.readAt = :now " +
           "WHERE n.user.id = :userId AND n.read = false")
    void markAllReadByUserId(@Param("userId") UUID userId, @Param("now") LocalDateTime now);
}
