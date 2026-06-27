package com.careeros.backend.dto.response;

import com.careeros.backend.entity.CareerLevel;
import com.careeros.backend.entity.Role;
import com.careeros.backend.entity.User;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        Role role,
        boolean emailVerified,
        String university,
        CareerLevel careerLevel,
        String bio,
        String phone,
        LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.isEmailVerified(),
                user.getUniversity(),
                user.getCareerLevel(),
                user.getBio(),
                user.getPhone(),
                user.getCreatedAt()
        );
    }
}
