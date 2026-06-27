package com.careeros.backend.controller;

import com.careeros.backend.dto.request.UpdateProfileRequest;
import com.careeros.backend.dto.response.ApiResponse;
import com.careeros.backend.dto.response.UserResponse;
import com.careeros.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Profile")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    ResponseEntity<ApiResponse<UserResponse>> getProfile() {
        return ResponseEntity.ok(userService.getProfile());
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    ResponseEntity<ApiResponse<UserResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(request));
    }

    @DeleteMapping("/me")
    @Operation(summary = "Delete account and all associated data")
    ResponseEntity<ApiResponse<Void>> deleteAccount() {
        return ResponseEntity.ok(userService.deleteAccount());
    }
}
