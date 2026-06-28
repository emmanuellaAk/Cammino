package com.careeros.backend.service;

import com.careeros.backend.dto.request.UpdateNotificationPreferenceRequest;
import com.careeros.backend.dto.response.ApiResponse;
import com.careeros.backend.dto.response.NotificationPreferenceResponse;
import com.careeros.backend.dto.response.NotificationResponse;
import com.careeros.backend.entity.*;
import com.careeros.backend.exception.ResourceNotFoundException;
import com.careeros.backend.repository.*;
import com.careeros.backend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static com.careeros.backend.entity.ApplicationStatus.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private static final List<ApplicationStatus> TERMINAL_STATUSES = List.of(REJECTED, OFFER);

    private final NotificationRepository           notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final JobRepository                    jobRepository;
    private final UserRepository                   userRepository;

    // ─── Public API ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ApiResponse<List<NotificationResponse>> list(boolean unreadOnly, int page, int size) {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        var pageable = PageRequest.of(page, Math.min(size, 50));

        var results = unreadOnly
                ? notificationRepository.findAllByUserIdAndReadFalseOrderByCreatedAtDesc(userId, pageable)
                : notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable);

        return ApiResponse.success(results.map(NotificationResponse::from).getContent());
    }

    @Transactional(readOnly = true)
    public ApiResponse<Long> unreadCount() {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        return ApiResponse.success(notificationRepository.countByUserIdAndReadFalse(userId));
    }

    @Transactional
    public ApiResponse<NotificationResponse> markRead(UUID id) {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        Notification n = notificationRepository.findById(id)
                .filter(notif -> notif.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));

        if (!n.isRead()) {
            n.setRead(true);
            n.setReadAt(LocalDateTime.now());
            notificationRepository.save(n);
        }
        return ApiResponse.success("Notification marked as read", NotificationResponse.from(n));
    }

    @Transactional
    public ApiResponse<Void> markAllRead() {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        notificationRepository.markAllReadByUserId(userId, LocalDateTime.now());
        return ApiResponse.success("All notifications marked as read");
    }

    @Transactional
    public ApiResponse<Void> delete(UUID id) {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        Notification n = notificationRepository.findById(id)
                .filter(notif -> notif.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
        notificationRepository.delete(n);
        return ApiResponse.success("Notification deleted");
    }

    // ─── Preferences ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ApiResponse<NotificationPreferenceResponse> getPreferences() {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        return preferenceRepository.findByUserId(userId)
                .map(p -> ApiResponse.success(NotificationPreferenceResponse.from(p)))
                .orElse(ApiResponse.success(NotificationPreferenceResponse.defaults()));
    }

    @Transactional
    public ApiResponse<NotificationPreferenceResponse> updatePreferences(UpdateNotificationPreferenceRequest request) {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        User user = userRepository.getReferenceById(userId);

        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElse(NotificationPreference.builder().user(user).build());

        if (request.deadlineRemindersEnabled() != null)
            pref.setDeadlineRemindersEnabled(request.deadlineRemindersEnabled());
        if (request.deadlineReminderDaysBefore() != null)
            pref.setDeadlineReminderDaysBefore(request.deadlineReminderDaysBefore());
        if (request.followUpRemindersEnabled() != null)
            pref.setFollowUpRemindersEnabled(request.followUpRemindersEnabled());
        if (request.followUpReminderDaysAfterApply() != null)
            pref.setFollowUpReminderDaysAfterApply(request.followUpReminderDaysAfterApply());
        if (request.statusChangeAlertsEnabled() != null)
            pref.setStatusChangeAlertsEnabled(request.statusChangeAlertsEnabled());
        if (request.aiAnalysisAlertsEnabled() != null)
            pref.setAiAnalysisAlertsEnabled(request.aiAnalysisAlertsEnabled());

        preferenceRepository.save(pref);
        return ApiResponse.success("Preferences updated", NotificationPreferenceResponse.from(pref));
    }

    // ─── Internal notification creation (called by other services) ───────────

    @Transactional
    public void createNotification(User user, NotificationType type, String title, String message, UUID relatedJobId) {
        if (!isEnabledForUser(user.getId(), type)) return;

        notificationRepository.save(Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .relatedJobId(relatedJobId)
                .build());
    }

    // ─── Scheduled Jobs ──────────────────────────────────────────────────────

    @Scheduled(cron = "0 0 7 * * *")
    @Transactional
    public void sendDeadlineReminders() {
        List<NotificationPreference> prefs = preferenceRepository.findAllEnabledForDeadlines();
        log.info("Checking deadline reminders for {} user(s)", prefs.size());

        for (NotificationPreference pref : prefs) {
            User user = pref.getUser();
            LocalDate from = LocalDate.now();
            LocalDate to   = from.plusDays(pref.getDeadlineReminderDaysBefore());

            List<Job> upcoming = jobRepository.findJobsWithDeadlineBetween(
                    user.getId(), from, to, TERMINAL_STATUSES);

            for (Job job : upcoming) {
                boolean alreadyNotified = notificationRepository
                        .existsByUserIdAndTypeAndRelatedJobIdAndCreatedAtAfter(
                                user.getId(), NotificationType.DEADLINE_REMINDER,
                                job.getId(), LocalDateTime.now().minusHours(20));
                if (alreadyNotified) continue;

                long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), job.getDeadline());
                notificationRepository.save(Notification.builder()
                        .user(user)
                        .type(NotificationType.DEADLINE_REMINDER)
                        .title("Deadline approaching: " + job.getJobTitle())
                        .message("Your application for " + job.getJobTitle() + " at " + job.getCompany()
                                 + " has a deadline in " + daysLeft + " day(s).")
                        .relatedJobId(job.getId())
                        .build());
            }
        }
    }

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void sendFollowUpReminders() {
        List<NotificationPreference> prefs = preferenceRepository.findAllEnabledForFollowUps();
        log.info("Checking follow-up reminders for {} user(s)", prefs.size());

        for (NotificationPreference pref : prefs) {
            User user = pref.getUser();
            LocalDate cutoff = LocalDate.now().minusDays(pref.getFollowUpReminderDaysAfterApply());

            List<Job> stale = jobRepository.findStaleAppliedJobs(user.getId(), cutoff);

            for (Job job : stale) {
                boolean alreadyNotified = notificationRepository
                        .existsByUserIdAndTypeAndRelatedJobIdAndCreatedAtAfter(
                                user.getId(), NotificationType.FOLLOW_UP_REMINDER,
                                job.getId(), LocalDateTime.now().minusDays(7));
                if (alreadyNotified) continue;

                long daysSince = ChronoUnit.DAYS.between(job.getAppliedAt(), LocalDate.now());
                notificationRepository.save(Notification.builder()
                        .user(user)
                        .type(NotificationType.FOLLOW_UP_REMINDER)
                        .title("Time to follow up: " + job.getJobTitle())
                        .message("You applied to " + job.getJobTitle() + " at " + job.getCompany()
                                 + " " + daysSince + " days ago — consider sending a follow-up.")
                        .relatedJobId(job.getId())
                        .build());
            }
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private boolean isEnabledForUser(UUID userId, NotificationType type) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElse(null);
        if (pref == null) return true; // default: all enabled
        return switch (type) {
            case DEADLINE_REMINDER  -> pref.isDeadlineRemindersEnabled();
            case FOLLOW_UP_REMINDER -> pref.isFollowUpRemindersEnabled();
            case STATUS_CHANGE      -> pref.isStatusChangeAlertsEnabled();
            case AI_ANALYSIS_READY  -> pref.isAiAnalysisAlertsEnabled();
            case SYSTEM             -> true;
        };
    }
}
