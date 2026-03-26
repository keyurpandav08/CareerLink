package com.keyurpandav.jobber.config;

import com.keyurpandav.jobber.entity.Role;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.repository.RoleRepository;
import com.keyurpandav.jobber.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initRolesAndAdmin(RoleRepository roleRepository,
                                        UserRepository userRepository,
                                        BCryptPasswordEncoder passwordEncoder) {
        return args -> {
            List<String> roles = List.of("APPLICANT", "EMPLOYER", "ADMIN");

            for (String roleName : roles) {
                if (roleRepository.findByName(roleName).isEmpty()) {
                    Role role = new Role();
                    role.setName(roleName);
                    roleRepository.save(role);
                    System.out.println("Seeded role: " + roleName);
                }
            }

            boolean adminExists = userRepository.findByUsername("admin").isPresent()
                    || userRepository.findByEmail("admin@joblithic.com").isPresent();

            if (!adminExists) {
                Role adminRole = roleRepository.findByName("ADMIN")
                        .orElseThrow(() -> new IllegalStateException("Admin role missing"));

                User adminUser = User.builder()
                        .username("admin")
                        .email("admin@joblithic.com")
                        .password(passwordEncoder.encode("Admin@123"))
                        .fullName("System Admin")
                        .phone("+91 9999999999")
                        .skills("Administration, Monitoring, Operations")
                        .experience("8+ years")
                        .role(adminRole)
                        .build();

                userRepository.save(adminUser);
                System.out.println("Seeded admin account: admin / Admin@123");
            }
        };
    }
}
