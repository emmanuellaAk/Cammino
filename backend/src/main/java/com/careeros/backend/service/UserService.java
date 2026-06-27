package com.careeros.backend.service;

import com.careeros.backend.dto.request.UpdateProfileRequest;
import com.careeros.backend.dto.response.ApiResponse;
import com.careeros.backend.dto.response.UserResponse;
import com.careeros.backend.entity.User;
import com.careeros.backend.repository.*;
import com.careeros.backend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Transactional(readOnly = true)
    public ApiResponse<UserResponse> getProfile() {
        User user = SecurityUtil.getCurrentUser();
        return ApiResponse.success(UserResponse.from(user));
    }

    @Transactional
    public ApiResponse<UserResponse> updateProfile(UpdateProfileRequest request) {
        User user = SecurityUtil.getCurrentUser();

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName().trim());
        if (request.getLastName() != null)  user.setLastName(request.getLastName().trim());
        if (request.getUniversity() != null) user.setUniversity(request.getUniversity().trim());
        if (request.getCareerLevel() != null) user.setCareerLevel(request.getCareerLevel());
        if (request.getBio() != null) user.setBio(request.getBio().trim());
        if (request.getPhone() != null) user.setPhone(request.getPhone().trim());

        userRepository.save(user);
        return ApiResponse.success("Profile updated", UserResponse.from(user));
    }

    @Transactional
    public ApiResponse<Void> deleteAccount() {
        User user = SecurityUtil.getCurrentUser();

        // Cascade via FK ON DELETE CASCADE handles token cleanup,
        // but we delete explicitly to release any non-cascaded data
        refreshTokenRepository.deleteAllByUserId(user.getId());
        emailVerificationTokenRepository.deleteAllByUserId(user.getId());
        passwordResetTokenRepository.deleteAllByUserId(user.getId());
        userRepository.delete(user);

        log.info("Account deleted: {}", user.getEmail());
        return ApiResponse.success("Account deleted successfully");
    }
}
