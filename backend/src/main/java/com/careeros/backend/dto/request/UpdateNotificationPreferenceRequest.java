package com.careeros.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateNotificationPreferenceRequest(
        Boolean deadlineRemindersEnabled,
        @Min(1) @Max(30) Integer deadlineReminderDaysBefore,
        Boolean followUpRemindersEnabled,
        @Min(1) @Max(90) Integer followUpReminderDaysAfterApply,
        Boolean statusChangeAlertsEnabled,
        Boolean aiAnalysisAlertsEnabled
) {}
