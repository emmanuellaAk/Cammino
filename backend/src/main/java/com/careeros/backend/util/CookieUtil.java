package com.careeros.backend.util;

import org.springframework.http.ResponseCookie;

public final class CookieUtil {

    private CookieUtil() {}

    public static ResponseCookie create(String name, String value, long maxAgeSeconds, boolean secure) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(maxAgeSeconds)
                .sameSite("Strict")
                .build();
    }

    public static ResponseCookie clear(String name, boolean secure) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(0)
                .sameSite("Strict")
                .build();
    }
}
