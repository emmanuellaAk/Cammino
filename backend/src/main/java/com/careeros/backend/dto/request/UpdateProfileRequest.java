package com.careeros.backend.dto.request;

import com.careeros.backend.entity.CareerLevel;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;

    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;

    @Size(max = 200)
    private String university;

    private CareerLevel careerLevel;

    @Size(max = 1000)
    private String bio;

    @Size(max = 20)
    private String phone;
}
