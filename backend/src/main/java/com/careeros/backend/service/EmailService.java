package com.careeros.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String baseUrl;
    private final String frontendUrl;

    // ObjectProvider resolves to null if JavaMailSender is not configured — no bean creation failure
    public EmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${spring.mail.from:noreply@careeros.com}") String fromAddress,
            @Value("${app.base-url:http://localhost:8080}") String baseUrl,
            @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl
    ) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.fromAddress = fromAddress;
        this.baseUrl = baseUrl;
        this.frontendUrl = frontendUrl;
    }

    public void sendVerificationEmail(String to, String token) {
        // Points at the frontend SPA, which calls the JSON verify-email API itself and
        // renders a real confirmation page — a direct link to the backend endpoint
        // used to dump raw JSON in the user's browser.
        String link = frontendUrl + "/verify-email?token=" + token;
        String body = """
                Welcome to CareerOS!

                Please verify your email address by clicking the link below:
                %s

                This link expires in 24 hours.

                If you did not create an account, you can safely ignore this email.
                """.formatted(link);

        send(to, "Verify your CareerOS email", body);
    }

    public void sendDuplicateRegistrationNotice(String to) {
        String body = """
                Someone just tried to create a new CareerOS account using this email address,
                which already has an account.

                If this was you, you can sign in as normal, or reset your password if you've
                forgotten it. If it wasn't you, no action is needed — your account is unaffected.
                """;

        send(to, "Someone tried to sign up with your CareerOS email", body);
    }

    public void sendPasswordResetEmail(String to, String token) {
        String link = baseUrl + "/api/auth/reset-password?token=" + token;
        String body = """
                You requested a password reset for your CareerOS account.

                Click the link below to set a new password:
                %s

                This link expires in 15 minutes.

                If you did not request this, you can safely ignore this email.
                """.formatted(link);

        send(to, "Reset your CareerOS password", body);
    }

    private void send(String to, String subject, String body) {
        if (mailSender == null) {
            log.info("DEV — Email to [{}] | Subject: {} | Body:\n{}", to, subject, body);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.debug("Email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
