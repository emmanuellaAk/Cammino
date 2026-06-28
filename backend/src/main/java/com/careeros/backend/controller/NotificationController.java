package com.careeros.backend.controller;

import com.careeros.backend.dto.request.UpdateNotificationPreferenceRequest;
import com.careeros.backend.dto.response.ApiResponse;
import com.careeros.backend.dto.response.NotificationPreferenceResponse;
import com.careeros.backend.dto.response.NotificationResponse;
import com.careeros.backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "List notifications (paginated); pass unreadOnly=true for badge feed")
    ResponseEntity<ApiResponse<List<NotificationResponse>>> list(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(notificationService.list(unreadOnly, page, size));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get count of unread notifications (for badge)")
    ResponseEntity<ApiResponse<Long>> unreadCount() {
        return ResponseEntity.ok(notificationService.unreadCount());
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    ResponseEntity<ApiResponse<NotificationResponse>> markRead(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.markRead(id));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    ResponseEntity<ApiResponse<Void>> markAllRead() {
        return ResponseEntity.ok(notificationService.markAllRead());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a notification")
    ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.delete(id));
    }

    @GetMapping("/preferences")
    @Operation(summary = "Get notification preferences (returns defaults if not yet set)")
    ResponseEntity<ApiResponse<NotificationPreferenceResponse>> getPreferences() {
        return ResponseEntity.ok(notificationService.getPreferences());
    }

    @PutMapping("/preferences")
    @Operation(summary = "Update notification preferences (all fields optional — only provided fields change)")
    ResponseEntity<ApiResponse<NotificationPreferenceResponse>> updatePreferences(
            @Valid @RequestBody UpdateNotificationPreferenceRequest request
    ) {
        return ResponseEntity.ok(notificationService.updatePreferences(request));
    }
}
