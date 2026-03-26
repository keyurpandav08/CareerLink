package com.keyurpandav.jobber;

import com.keyurpandav.jobber.entity.Role;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.repository.RoleRepository;
import com.keyurpandav.jobber.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class UserRepositoryLobMappingIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void findByUsernameReadsTextBackedProfileFieldsWithoutLobErrors() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String username = "lob_test_" + suffix;
        String email = username + "@example.com";

        Role applicantRole = roleRepository.findByName("APPLICANT")
                .orElseGet(() -> roleRepository.save(Role.builder().name("APPLICANT").build()));

        User savedUser = userRepository.saveAndFlush(User.builder()
                .username(username)
                .email(email)
                .password("encoded-password")
                .fullName("LOB Mapping Test")
                .role(applicantRole)
                .gender("Other")
                .location("Pune")
                .dateOfBirth(LocalDate.of(2000, 1, 1))
                .profileSummary("Profile summary stored as regular text.")
                .internships("Internship entry one\nInternship entry two")
                .projects("Project entry one\nProject entry two")
                .certifications("Certification entry one\nCertification entry two")
                .companyLogoUrl("https://example.com/logo.png")
                .build());

        entityManager.clear();

        User reloadedUser = userRepository.findByUsername(username).orElseThrow();

        assertNotNull(reloadedUser);
        assertEquals(savedUser.getId(), reloadedUser.getId());
        assertEquals("Internship entry one\nInternship entry two", reloadedUser.getInternships());
        assertEquals("Project entry one\nProject entry two", reloadedUser.getProjects());
        assertEquals("Certification entry one\nCertification entry two", reloadedUser.getCertifications());
        assertEquals("https://example.com/logo.png", reloadedUser.getCompanyLogoUrl());

        userRepository.deleteById(reloadedUser.getId());
    }
}
