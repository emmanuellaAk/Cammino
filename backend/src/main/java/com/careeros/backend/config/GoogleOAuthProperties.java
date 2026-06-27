package com.careeros.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.google")
public record GoogleOAuthProperties(
        String clientId,
        String clientSecret,
        @DefaultValue("http://localhost:8080/api/email/connect/google/callback") String redirectUri,
        @DefaultValue("http://localhost:3000") String frontendUrl
) {}
