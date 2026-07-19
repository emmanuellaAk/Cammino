package com.careeros.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app.rate-limit.auth")
@Getter
@Setter
public class RateLimitProperties {
    private int capacity = 10;
    private int refillTokens = 10;
    private int refillDurationMinutes = 15;

    // Only trust the X-Forwarded-For header when the request's actual socket address
    // is one of these known reverse proxies. Empty by default — trusting XFF
    // unconditionally lets any client spoof a new "IP" on every request and bypass
    // rate limiting entirely, since it's just a client-supplied header otherwise.
    private List<String> trustedProxies = List.of();
}
