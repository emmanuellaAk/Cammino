package com.careeros.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage")
@Getter
@Setter
public class FileStorageProperties {
    private String uploadDir = "./uploads";
    private int maxResumesPerUser = 10;
}
