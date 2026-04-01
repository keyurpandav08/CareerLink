package com.keyurpandav.jobber.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.keyurpandav.jobber.config.AiProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiClientService {

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper;

    public JsonNode generateStructuredJson(String instruction, Object context) {
        ensureConfigured();

        try {
            String contextJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(context);
            Map<String, Object> payload = Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of(
                                    "text", instruction + "\n\nContext JSON:\n" + contextJson
                            ))
                    )),
                    "generationConfig", Map.of(
                            "temperature", 0.2,
                            "responseMimeType", "application/json"
                    )
            );

            String responseBody = RestClient.create(aiProperties.getBaseUrl())
                    .post()
                    .uri("/{model}:generateContent", aiProperties.getModel())
                    .header("x-goog-api-key", aiProperties.getApiKey().trim())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                throw new IllegalStateException("Gemini response did not contain structured content.");
            }

            return objectMapper.readTree(extractJson(textNode.asText()));
        } catch (RestClientResponseException exception) {
            throw new IllegalStateException("Gemini request failed: " + trimMessage(exception.getResponseBodyAsString()));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to process Gemini response: " + trimMessage(exception.getMessage()));
        }
    }

    private void ensureConfigured() {
        if (!aiProperties.isEnabled()) {
            throw new IllegalStateException("AI analysis is disabled in application.properties.");
        }
        if (aiProperties.getApiKey() == null || aiProperties.getApiKey().isBlank()) {
            throw new IllegalStateException("Gemini API key is missing. Set app.ai.gemini.api-key in application.properties.");
        }
    }

    private String extractJson(String raw) {
        String trimmed = raw == null ? "" : raw.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
        }

        int objectStart = trimmed.indexOf('{');
        int arrayStart = trimmed.indexOf('[');
        int start = objectStart >= 0 && (arrayStart < 0 || objectStart < arrayStart) ? objectStart : arrayStart;

        int objectEnd = trimmed.lastIndexOf('}');
        int arrayEnd = trimmed.lastIndexOf(']');
        int end = Math.max(objectEnd, arrayEnd);

        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }

        return trimmed;
    }

    private String trimMessage(String message) {
        if (message == null || message.isBlank()) {
            return "Unknown Gemini error";
        }
        return message.length() > 280 ? message.substring(0, 280) + "..." : message;
    }
}
