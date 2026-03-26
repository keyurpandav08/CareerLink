package com.keyurpandav.jobber.entity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.time.LocalDate;
import java.sql.Timestamp;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Column(unique = true)
    private String username;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Column(unique = true, nullable = false)
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;
    
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;
    
    private String phone;
    private String gender;
    private String location;
    private LocalDate dateOfBirth;
    private String skills;
    private String experience;
    private String tenthMarks;
    private String twelfthMarks;
    @Column(length = 500)
    private String graduation;
    @Column(length = 2500)
    private String profileSummary;
    @Column(length = 1200)
    private String languages;
    @Column(columnDefinition = "TEXT")
    private String internships;
    @Column(columnDefinition = "TEXT")
    private String projects;
    @Column(columnDefinition = "TEXT")
    private String certifications;
    @Column(length = 500)
    private String resumeUrl;
    @Column(length = 255)
    private String resumeFileName;
    @Column(length = 1200)
    private String resumeStoragePath;
    @Column(length = 255)
    private String companyName;
    @Column(columnDefinition = "TEXT")
    private String companyLogoUrl;
    @Column(length = 1500)
    private String companyOverview;
    @Column(length = 500)
    private String companyReviewSummary;
    private Integer companyReviewCount;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;
    
    @OneToMany(mappedBy = "employer", cascade = CascadeType.ALL)
    private List<Job> jobs;
    
    @OneToMany(mappedBy = "applicant", cascade = CascadeType.ALL)
    private List<Application> applications;
    
    private Timestamp createdAt;
    
    @PrePersist
    protected void onCreate(){
        this.createdAt = new Timestamp(System.currentTimeMillis());
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities(){
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.getName().toUpperCase()));
    }
    
    @Override public boolean isAccountNonExpired(){ return true; }
    @Override public boolean isAccountNonLocked(){ return true; }
    @Override public boolean isCredentialsNonExpired(){ return true; }
    @Override public boolean isEnabled(){ return true; }
}
