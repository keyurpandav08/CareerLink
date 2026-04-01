package com.keyurpandav.jobber.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.ai.gemini")
public class AiProperties {

    private boolean enabled = true;
    private String baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
    private String model = "gemini-2.5-flash";
    private String apiKey = "";
}
