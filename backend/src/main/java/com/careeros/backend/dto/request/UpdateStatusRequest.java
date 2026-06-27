package com.careeros.backend.dto.request;

import com.careeros.backend.entity.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateStatusRequest {

    @NotNull(message = "Status is required")
    private ApplicationStatus status;

    private LocalDate appliedAt;
}
