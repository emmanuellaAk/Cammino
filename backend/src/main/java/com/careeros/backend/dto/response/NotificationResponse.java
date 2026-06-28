package com.careeros.backend.dto.response;

import com.careeros.backend.entity.Notification;
import com.careeros.backend.entity.NotificationType;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        UUID relatedJobId,
        boolean read,
        LocalDateTime readAt,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.getRelatedJobId(),
                n.isRead(),
                n.getReadAt(),
                n.getCreatedAt()
        );
    }
}
