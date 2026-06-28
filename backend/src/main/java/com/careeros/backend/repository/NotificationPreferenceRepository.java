package com.careeros.backend.repository;

import com.careeros.backend.entity.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, UUID> {

    Optional<NotificationPreference> findByUserId(UUID userId);

    @Query("SELECT np FROM NotificationPreference np JOIN FETCH np.user " +
           "WHERE np.deadlineRemindersEnabled = true")
    List<NotificationPreference> findAllEnabledForDeadlines();

    @Query("SELECT np FROM NotificationPreference np JOIN FETCH np.user " +
           "WHERE np.followUpRemindersEnabled = true")
    List<NotificationPreference> findAllEnabledForFollowUps();
}
