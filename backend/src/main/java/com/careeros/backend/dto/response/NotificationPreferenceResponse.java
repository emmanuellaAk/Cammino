package com.careeros.backend.dto.response;

import com.careeros.backend.entity.NotificationPreference;

public record NotificationPreferenceResponse(
        boolean deadlineRemindersEnabled,
        int deadlineReminderDaysBefore,
        boolean followUpRemindersEnabled,
        int followUpReminderDaysAfterApply,
        boolean statusChangeAlertsEnabled,
        boolean aiAnalysisAlertsEnabled
) {
    public static NotificationPreferenceResponse from(NotificationPreference p) {
        return new NotificationPreferenceResponse(
                p.isDeadlineRemindersEnabled(),
                p.getDeadlineReminderDaysBefore(),
                p.isFollowUpRemindersEnabled(),
                p.getFollowUpReminderDaysAfterApply(),
                p.isStatusChangeAlertsEnabled(),
                p.isAiAnalysisAlertsEnabled()
        );
    }

    public static NotificationPreferenceResponse defaults() {
        return new NotificationPreferenceResponse(true, 3, true, 14, true, true);
    }
}
