package com.keyurpandav.jobber.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.keyurpandav.jobber.dto.JobDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResumeAnalysisService {

    private final JobService jobService;
    private final GeminiClientService geminiClientService;

    public Map<String, Object> analyze(String resumeText, String targetRole, String additionalSkills) {
        List<JobDto> liveJobs = jobService.getAllJobs().stream().limit(16).toList();

        Map<String, Object> context = Map.of(
                "targetRole", targetRole == null ? "" : targetRole,
                "additionalSkills", additionalSkills == null ? "" : additionalSkills,
                "resumeText", shorten(resumeText, 14000),
                "liveJobs", liveJobs.stream().map(this::compactJob).toList()
        );

        String instruction = """
                You are the CareerLink AI resume analyst.
                Return strict JSON only with this exact structure:
                {
                  "recommendedRole": "string",
                  "score": 0,
                  "detectedSkills": ["string"],
                  "missingSkills": ["string"],
                  "level": "Beginner",
                  "insight": "string",
                  "resumeRewrite": "string",
                  "learningPath": {
                    "beginner": ["string"],
                    "intermediate": ["string"],
                    "advanced": ["string"]
                  },
                  "suggestedJobIds": [0, 0, 0]
                }
                Rules:
                - Use only the provided liveJobs jobId values.
                - score must be an integer from 0 to 100.
                - detectedSkills and missingSkills should each contain up to 8 items.
                - learningPath arrays should each contain up to 3 items.
                - resumeRewrite should be a concise upgraded profile summary that the candidate can reuse.
                - insight should be one sharp sentence.
                """;

        JsonNode ai = geminiClientService.generateStructuredJson(instruction, context);
        Map<String, List<String>> learningPath = new LinkedHashMap<>();
        JsonNode learningNode = ai.path("learningPath");
        learningPath.put("beginner", extractStringList(learningNode.path("beginner"), 3));
        learningPath.put("intermediate", extractStringList(learningNode.path("intermediate"), 3));
        learningPath.put("advanced", extractStringList(learningNode.path("advanced"), 3));

        return Map.of(
                "recommendedRole", defaultText(ai.path("recommendedRole").asText(), "Career fit analysis ready"),
                "score", clamp(ai.path("score").asInt(80), 0, 100),
                "detectedSkills", extractStringList(ai.path("detectedSkills"), 8),
                "missingSkills", extractStringList(ai.path("missingSkills"), 8),
                "level", defaultText(ai.path("level").asText(), "Intermediate"),
                "insight", defaultText(ai.path("insight").asText(), "Your profile is strongest when it emphasizes role-specific impact."),
                "resumeRewrite", defaultText(ai.path("resumeRewrite").asText(), "Rewrite your summary to highlight measurable impact and the exact stack you want to target."),
                "learningPath", learningPath,
                "suggestedJobs", suggestJobs(ai.path("suggestedJobIds"), liveJobs)
        );
    }

    private Map<String, Object> compactJob(JobDto job) {
        return Map.of(
                "jobId", job.getId(),
                "title", job.getTitle(),
                "company", job.getEmployerName(),
                "location", job.getLocation(),
                "experienceLevel", defaultText(job.getExperienceLevel(), "Not specified"),
                "keySkills", splitTags(job.getKeySkills()),
                "jobHighlights", splitTags(job.getJobHighlights())
        );
    }

    private List<Map<String, Object>> suggestJobs(JsonNode suggestedJobIdsNode, List<JobDto> liveJobs) {
        Map<Long, JobDto> jobsById = liveJobs.stream()
                .collect(Collectors.toMap(JobDto::getId, job -> job, (left, right) -> left, LinkedHashMap::new));

        List<Map<String, Object>> suggestedJobs = new ArrayList<>();
        if (!suggestedJobIdsNode.isArray()) {
            return suggestedJobs;
        }

        for (JsonNode jobIdNode : suggestedJobIdsNode) {
            JobDto job = jobsById.get(jobIdNode.asLong(-1));
            if (job == null) {
                continue;
            }
            suggestedJobs.add(Map.of(
                    "id", job.getId(),
                    "title", job.getTitle(),
                    "location", job.getLocation(),
                    "company", job.getEmployerName()
            ));
            if (suggestedJobs.size() == 3) {
                break;
            }
        }
        return suggestedJobs;
    }

    private List<String> extractStringList(JsonNode node, int limit) {
        List<String> values = new ArrayList<>();
        if (!node.isArray()) {
            return values;
        }
        for (JsonNode item : node) {
            String value = item.asText("").trim();
            if (!value.isBlank()) {
                values.add(value);
            }
            if (values.size() == limit) {
                break;
            }
        }
        return values;
    }

    private List<String> splitTags(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return List.of(value.split("[,|\\n]")).stream()
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .limit(8)
                .toList();
    }

    private String shorten(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) + "..." : trimmed;
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
