package com.careeros.backend.security;

import com.careeros.backend.exception.UnauthorizedException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component
@Slf4j
public class JwtUtil {

    private final JwtProperties jwtProperties;
    private final SecretKey     signingKey;

    public JwtUtil(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtProperties.getSecret()));
    }

    public String generateAccessToken(UserDetails userDetails) {
        return buildToken(new HashMap<>(), userDetails, jwtProperties.getAccessTokenExpirationMs());
    }

    public String generateAccessToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, jwtProperties.getAccessTokenExpirationMs());
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    public String generateOAuthState(UUID userId) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("purpose", "oauth-state")
                .id(UUID.randomUUID().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 5 * 60 * 1000L))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public UUID validateOAuthState(String token) {
        try {
            Claims claims = extractAllClaims(token);
            if (!"oauth-state".equals(claims.get("purpose"))) {
                throw new UnauthorizedException("Invalid OAuth state");
            }
            return UUID.fromString(claims.getSubject());
        } catch (JwtException e) {
            throw new UnauthorizedException("OAuth state expired or invalid");
        }
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, long expirationMs) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .id(UUID.randomUUID().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
