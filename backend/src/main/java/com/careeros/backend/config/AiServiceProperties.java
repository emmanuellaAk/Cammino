package com.careeros.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.ai")
public record AiServiceProperties(
        @DefaultValue("http://localhost:8000") String baseUrl,
        @DefaultValue("") String apiKey,
        @DefaultValue("30") int timeoutSeconds
) {}
