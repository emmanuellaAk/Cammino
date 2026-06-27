package com.careeros.backend.dto.response;

import com.careeros.backend.entity.GmailConnection;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GmailConnectionResponse(
        boolean connected,
        String gmailAddress,
        LocalDateTime connectedAt,
        LocalDateTime lastSyncAt
) {
    public static GmailConnectionResponse connected(GmailConnection conn) {
        return new GmailConnectionResponse(true, conn.getGmailAddress(), conn.getConnectedAt(), conn.getLastSyncAt());
    }

    public static GmailConnectionResponse disconnected() {
        return new GmailConnectionResponse(false, null, null, null);
    }
}
