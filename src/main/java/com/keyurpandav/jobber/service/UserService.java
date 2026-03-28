package com.keyurpandav.jobber.service;

import com.keyurpandav.jobber.dto.UserDto;
import com.keyurpandav.jobber.entity.Role;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.repository.RoleRepository;
import com.keyurpandav.jobber.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final String DEFAULT_ROLE = "APPLICANT";
    private static final Set<String> SELF_REGISTER_ROLES = Set.of("APPLICANT", "EMPLOYER");
    private static final String GOOGLE_USER_PASSWORD = "google-auth-user";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserDto register(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists: " + user.getUsername());
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already registered: " + user.getEmail());
        }

        String requestedRole = resolveRequestedRole(user);
        if (!SELF_REGISTER_ROLES.contains(requestedRole)) {
            throw new RuntimeException("Only applicant or employer accounts can be created from registration.");
        }

        Role role = getRoleByName(requestedRole);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return saveUserAsDto(user);
    }

    public List<UserDto> getAll() {
        return userRepository.findAll().stream()
                .map(UserDto::toDto)
                .toList();
    }

    public UserDto getByEmail(String email) {
        return UserDto.toDto(getUserByEmail(email));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User Not Found"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));
    }

    public UserDto updateUserProfile(Long userId, User updatedData) {
        User user = getExistingUserForUpdate(userId);
        copyProfileFields(updatedData, user);
        return saveUserAsDto(user);
    }

    public UserDto updateResumeMetadata(Long userId, String resumeUrl, String resumeFileName, String resumeStoragePath) {
        User user = getExistingUserForUpdate(userId);
        user.setResumeUrl(resumeUrl);
        user.setResumeFileName(resumeFileName);
        user.setResumeStoragePath(resumeStoragePath);
        return saveUserAsDto(user);
    }

    public User updatePassword(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        user.setPassword(passwordEncoder.encode(rawPassword));
        return userRepository.save(user);
    }

    public User findOrCreateGoogleApplicant(String email, String fullName) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> {
                    String username = buildUniqueGoogleUsername(email);
                    User user = User.builder()
                            .username(username)
                            .email(email)
                            .password(passwordEncoder.encode(GOOGLE_USER_PASSWORD))
                            .fullName(resolveGoogleFullName(fullName, username))
                            .role(getRoleByName(DEFAULT_ROLE))
                            .build();

                    return userRepository.save(user);
                });
    }

    private String resolveRequestedRole(User user) {
        if (user.getRole() == null) {
            return DEFAULT_ROLE;
        }

        if (user.getRole().getId() != null) {
            return roleRepository.findById(user.getRole().getId())
                    .map(Role::getName)
                    .map(roleName -> roleName.toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> new RuntimeException("Role not found"));
        }

        if (user.getRole().getName() != null && !user.getRole().getName().isBlank()) {
            return user.getRole().getName().trim().toUpperCase(Locale.ROOT);
        }

        return DEFAULT_ROLE;
    }

    private UserDto saveUserAsDto(User user) {
        return UserDto.toDto(userRepository.save(user));
    }

    private User getExistingUserForUpdate(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Role getRoleByName(String roleName) {
        return roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));
    }

    private void copyProfileFields(User source, User target) {
        target.setFullName(source.getFullName());
        target.setEmail(source.getEmail());
        target.setPhone(source.getPhone());
        target.setGender(source.getGender());
        target.setLocation(source.getLocation());
        target.setDateOfBirth(source.getDateOfBirth());
        target.setSkills(source.getSkills());
        target.setExperience(source.getExperience());
        target.setTenthMarks(source.getTenthMarks());
        target.setTwelfthMarks(source.getTwelfthMarks());
        target.setGraduation(source.getGraduation());
        target.setProfileSummary(source.getProfileSummary());
        target.setLanguages(source.getLanguages());
        target.setInternships(source.getInternships());
        target.setProjects(source.getProjects());
        target.setCertifications(source.getCertifications());
        target.setCompanyName(source.getCompanyName());
        target.setCompanyLogoUrl(source.getCompanyLogoUrl());
        target.setCompanyOverview(source.getCompanyOverview());
        target.setCompanyReviewSummary(source.getCompanyReviewSummary());
        target.setCompanyReviewCount(source.getCompanyReviewCount());
    }

    private String buildUniqueGoogleUsername(String email) {
        String baseUsername = email.split("@")[0]
                .replaceAll("[^a-zA-Z0-9._-]", "")
                .toLowerCase(Locale.ROOT);

        if (baseUsername.isBlank()) {
            baseUsername = "user";
        }

        String username = baseUsername;
        int suffix = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + suffix++;
        }
        return username;
    }

    private String resolveGoogleFullName(String fullName, String username) {
        if (fullName != null && !fullName.isBlank()) {
            return fullName;
        }
        return username;
    }
}
