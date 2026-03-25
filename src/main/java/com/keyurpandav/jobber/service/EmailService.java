package com.keyurpandav.jobber.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public void sendJobAlertEmail(String toEmail, String userName, String jobTitle, String companyName, String jobLink) {
        sendTextEmail(
                toEmail,
                "New Job Alert",
                "Hello " + safe(userName) + ",\n\n"
                        + "A new job is available on JobLithic.\n\n"
                        + "Role: " + safe(jobTitle) + "\n"
                        + "Company: " + safe(companyName) + "\n"
                        + "Link: " + safe(jobLink) + "\n\n"
                        + "JobLithic Team"
        );
    }

    public void sendApplicationConfirmation(String email, String jobTitle) {
        sendTextEmail(
                email,
                "Application Submitted Successfully",
                "Your application has been submitted successfully.\n\n"
                        + "Role: " + safe(jobTitle) + "\n\n"
                        + "We will notify you when the employer updates your application.\n\n"
                        + "JobLithic Team"
        );
    }

    public void sendOtpEmail(String email, String fullName, String otp, long expiryMinutes) {
        sendTextEmail(
                email,
                "JobLithic Password Reset OTP",
                "Hello " + safe(fullName) + ",\n\n"
                        + "Your OTP for password reset is: " + safe(otp) + "\n"
                        + "This OTP will expire in " + expiryMinutes + " minutes.\n\n"
                        + "If you did not request this, ignore this email.\n\n"
                        + "JobLithic Team"
        );
    }

    public void sendPasswordResetSuccessEmail(String email, String fullName) {
        sendTextEmail(
                email,
                "Password Reset Successful",
                "Hello " + safe(fullName) + ",\n\n"
                        + "Your password has been reset successfully.\n"
                        + "Login here: " + safe(frontendBaseUrl) + "/login\n\n"
                        + "JobLithic Team"
        );
    }

    public void sendApplicationStatusUpdate(String email, String fullName, String jobTitle, String employerName, String status) {
        sendTextEmail(
                email,
                "Application Status Updated",
                "Hello " + safe(fullName) + ",\n\n"
                        + "Your application status has been updated.\n\n"
                        + "Role: " + safe(jobTitle) + "\n"
                        + "Employer: " + safe(employerName) + "\n"
                        + "Status: " + safe(status) + "\n\n"
                        + "Please check your JobLithic dashboard for more details.\n\n"
                        + "JobLithic Team"
        );
    }

    private void sendTextEmail(String toEmail, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException(getMailErrorMessage(e), e);
        }
    }

    private String getMailErrorMessage(Exception e) {
        Throwable current = e;
        while (current != null) {
            String message = current.getMessage();
            if (message != null && !message.isBlank()) {
                if (message.toLowerCase().contains("authentication failed")
                        || message.contains("535")
                        || message.toLowerCase().contains("username and password not accepted")) {
                    return "Authentication failed";
                }
            }
            current = current.getCause();
        }
        return "Failed to send email";
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
