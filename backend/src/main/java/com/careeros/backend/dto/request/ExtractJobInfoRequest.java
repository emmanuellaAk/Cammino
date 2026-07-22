package com.careeros.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ExtractJobInfoRequest {

    @NotBlank(message = "URL is required")
    @Size(max = 2048, message = "URL is too long")
    private String url;
}
