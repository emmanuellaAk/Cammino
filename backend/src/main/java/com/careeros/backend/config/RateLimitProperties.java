package com.careeros.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.rate-limit.auth")
@Getter
@Setter
public class RateLimitProperties {
    private int capacity = 10;
    private int refillTokens = 10;
    private int refillDurationMinutes = 15;
}
