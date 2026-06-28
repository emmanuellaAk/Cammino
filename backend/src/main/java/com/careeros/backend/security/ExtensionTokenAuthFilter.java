package com.careeros.backend.security;

import com.careeros.backend.entity.User;
import com.careeros.backend.repository.ExtensionTokenRepository;
import com.careeros.backend.util.TokenHashUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Handles browser extension personal access tokens (PAT).
 * Runs after JwtAuthenticationFilter — only acts when no auth is already set.
 * PATs are identified as Bearer tokens that contain no dots (unlike JWTs).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ExtensionTokenAuthFilter extends OncePerRequestFilter {

    private final ExtensionTokenRepository extensionTokenRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain
    ) throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(request, response);
            return;
        }

        String bearerToken = extractBearerToken(request);
        if (bearerToken == null || bearerToken.contains(".")) {
            chain.doFilter(request, response);
            return;
        }

        try {
            String hash = TokenHashUtil.sha256(bearerToken);
            extensionTokenRepository.findByTokenHashWithUser(hash)
                    .filter(t -> t.getExpiresAt() == null || t.getExpiresAt().isAfter(LocalDateTime.now()))
                    .ifPresent(token -> {
                        User user = token.getUser();
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                user, null, user.getAuthorities());
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        log.debug("Authenticated extension request for user {}", user.getId());
                    });
        } catch (Exception e) {
            log.debug("Extension token auth failed: {}", e.getMessage());
        }

        chain.doFilter(request, response);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
