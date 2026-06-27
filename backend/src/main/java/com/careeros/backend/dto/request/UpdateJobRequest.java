package com.careeros.backend.dto.request;

import com.careeros.backend.entity.ApplicationStatus;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateJobRequest {

    @Size(max = 255)
    private String jobTitle;

    @Size(max = 255)
    private String company;

    @Size(max = 255)
    private String location;

    @Size(max = 2000)
    private String jobUrl;

    private String description;

    @Size(max = 100)
    private String salary;

    private ApplicationStatus status;

    private LocalDate deadline;

    private LocalDate appliedAt;

    @Size(max = 100)
    private String source;
}
