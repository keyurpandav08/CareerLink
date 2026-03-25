package com.keyurpandav.jobber.service;

import com.keyurpandav.jobber.config.SecurityConfig;
import com.keyurpandav.jobber.dto.UserDto;
import com.keyurpandav.jobber.entity.Role;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.repository.RoleRepository;
import com.keyurpandav.jobber.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SecurityConfig securityConfig;

    public UserDto register(User user){
        // Check for duplicate username or email
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists: " + user.getUsername());
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already registered: " + user.getEmail());
        }

        if (user.getRole() == null) {
            user.setRole(roleRepository.findByName("APPLICANT")
                    .orElseThrow(() -> new RuntimeException("Default role missing")));
        } else if (user.getRole().getId() != null) {
            Role r = roleRepository.findById(user.getRole().getId())
                    .orElseThrow(() -> new RuntimeException("Role not found"));
            user.setRole(r);
        } else if (user.getRole().getName() != null && !user.getRole().getName().isBlank()) {
            Role r = roleRepository.findByName(user.getRole().getName().toUpperCase())
                    .orElseThrow(() -> new RuntimeException("Role not found"));
            user.setRole(r);
        } else {
            user.setRole(roleRepository.findByName("APPLICANT")
                    .orElseThrow(() -> new RuntimeException("Default role missing")));
        }

        // Encode password
        user.setPassword(securityConfig.passwordEncoder().encode(user.getPassword()));

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

        user.setPassword(securityConfig.passwordEncoder().encode(rawPassword));
        return userRepository.save(user);
    }
}
