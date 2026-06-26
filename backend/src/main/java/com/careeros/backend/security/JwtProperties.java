package com.careeros.backend.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
@Getter
@Setter
public class JwtProperties {
    private String secret;
    private long accessTokenExpirationMs = 900_000;
    private long refreshTokenExpirationMs = 604_800_000;
    private String cookieName = "careeros_access";
    private String refreshCookieName = "careeros_refresh";
}
