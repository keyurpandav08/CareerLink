package com.keyurpandav.jobber.controller;

import com.keyurpandav.jobber.service.ResumeAnalysisService;
import com.keyurpandav.jobber.service.ResumeParserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeAnalysisController {

    private final ResumeParserService resumeParserService;
    private final ResumeAnalysisService resumeAnalysisService;

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeResume(
            @RequestParam("resume") MultipartFile resumeFile,
            @RequestParam(value = "targetRole", required = false) String targetRole,
            @RequestParam(value = "additionalSkills", required = false) String additionalSkills
    ) {
        try {
            String resumeText = resumeParserService.extractContent(resumeFile);
            Map<String, Object> analysis = resumeAnalysisService.analyze(resumeText, targetRole, additionalSkills);
            return ResponseEntity.ok(Map.of(
                    "message", "Resume analyzed successfully",
                    "analysis", analysis
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
