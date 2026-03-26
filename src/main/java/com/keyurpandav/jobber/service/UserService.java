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
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final String DEFAULT_ROLE = "APPLICANT";
    private static final Set<String> SELF_REGISTER_ROLES = Set.of("APPLICANT", "EMPLOYER");

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserDto register(User user){
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

        Role role = roleRepository.findByName(requestedRole)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return UserDto.toDto(userRepository.save(user));
    }

    public List<UserDto> getAll(){
        return userRepository.findAll().stream().map(UserDto::toDto).toList();
    }

    public  UserDto getByEmail(String email){
        return userRepository.findByEmail(email).map(UserDto::toDto)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId).orElseThrow(()->new IllegalArgumentException("User Not Found"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));
    }

    public UserDto updateUserProfile(Long userId, User updatedData) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFullName(updatedData.getFullName());
        user.setEmail(updatedData.getEmail());
        user.setPhone(updatedData.getPhone());
        user.setSkills(updatedData.getSkills());
        user.setExperience(updatedData.getExperience());

        return UserDto.toDto(userRepository.save(user));
    }

    public User updatePassword(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        user.setPassword(passwordEncoder.encode(rawPassword));
        return userRepository.save(user);
    }

    private String resolveRequestedRole(User user) {
        if (user.getRole() == null) {
            return DEFAULT_ROLE;
        }

        if (user.getRole().getId() != null) {
            return roleRepository.findById(user.getRole().getId())
                    .map(Role::getName)
                    .map(String::toUpperCase)
                    .orElseThrow(() -> new RuntimeException("Role not found"));
        }

        if (user.getRole().getName() != null && !user.getRole().getName().isBlank()) {
            return user.getRole().getName().trim().toUpperCase();
        }

        return DEFAULT_ROLE;
    }
}
