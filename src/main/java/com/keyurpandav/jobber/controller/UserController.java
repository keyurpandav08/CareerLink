package com.keyurpandav.jobber.controller;
import com.keyurpandav.jobber.dto.UserDto;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.service.ResumeAnalysisService;
import com.keyurpandav.jobber.service.ResumeParserService;
import com.keyurpandav.jobber.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final ResumeParserService resumeParserService;
    private final ResumeAnalysisService resumeAnalysisService;
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            bindingResult.getFieldErrors().forEach(error -> 
                errors.put(error.getField(), error.getDefaultMessage())
            );
            return ResponseEntity.badRequest().body(errors);
        }
        
        try {
            UserDto registeredUser = userService.register(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping
    public List<UserDto> all(){
        return userService.getAll();
    }
    
    @GetMapping("/email/{email}")
    public UserDto byEmail(@PathVariable String email){ 
        return userService.getByEmail(email); 
    }

    @GetMapping("/username/{username}")
    public UserDto byUsername(@PathVariable String username){
        return UserDto.toDto(userService.getUserByUsername(username));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody User updatedUser) {
        try {
            UserDto updated = userService.updateUserProfile(id, updatedUser);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/upload-resume")
    public ResponseEntity<?> uploadResume(
            @RequestParam("userId") Long userId,
            @RequestParam("resume") MultipartFile resumeFile,
            @RequestParam(value = "targetRole", required = false) String targetRole
    ) {
        try {
            User user = userService.getUserById(userId);
            String resumeText = resumeParserService.extractContent(resumeFile);
            Map<String, Object> analysis = resumeAnalysisService.analyze(resumeText, targetRole, user.getSkills());

            return ResponseEntity.ok(Map.of(
                    "message", "Resume uploaded and analyzed successfully",
                    "fileName", resumeFile.getOriginalFilename(),
                    "analysis", analysis
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
