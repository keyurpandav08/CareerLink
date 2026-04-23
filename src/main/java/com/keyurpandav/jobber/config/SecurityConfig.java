package com.keyurpandav.jobber.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class SecurityConfig {

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:5174}")
    private String allowedOrigins;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Swagger / OpenAPI
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/favicon.ico",
                                "/error",
                                "/assets/**",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/login",
                                "/register",
                                "/forgot-password",
                                "/privacy-policy",
                                "/terms",
                                "/contact",
                                "/career-advice",
                                "/interview-tips",
                                "/talent-search",
                                "/jobs",
                                "/jobs/**",
                                "/admin/login"
                        ).permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/resume/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/users/register").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/job", "/job/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/job/**").hasRole("EMPLOYER")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/job/**").hasRole("EMPLOYER")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/job/**").hasRole("EMPLOYER")

                        .requestMatchers("/applications/apply", "/applications/apply-json").hasRole("APPLICANT")
                        .requestMatchers("/applications/user/**").hasRole("APPLICANT")
                        .requestMatchers("/applications/employer/**").hasRole("EMPLOYER")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/applications/**").hasRole("EMPLOYER")

                        .requestMatchers("/employer/**").hasRole("EMPLOYER")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/users/upload-resume").hasRole("APPLICANT")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .defaultAuthenticationEntryPointFor(
                                unauthorizedEntryPoint(),
                                request -> request.getRequestURI().startsWith("/api/")
                        )
                )
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/api/auth/login")
                        .successHandler((request, response, authentication) -> {
                            response.setStatus(200); // OK
                            response.setContentType("application/json");
                            response.getWriter().write("{\"message\": \"Login successful\"}");
                        })
                        .failureHandler((request, response, exception) -> {
                            response.setStatus(401); // Unauthorized
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\": \"Login failed\"}");
                        })
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessHandler((request, response, authentication) -> response.setStatus(200))
                        .permitAll()
                )
                .headers(headers -> headers.frameOptions(frame -> frame.disable()));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(
                java.util.Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .filter(origin -> !origin.isBlank())
                        .collect(Collectors.toList())
        );
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private AuthenticationEntryPoint unauthorizedEntryPoint() {
        return (request, response, authException) -> response.sendError(401, "Unauthorized");
    }
}
