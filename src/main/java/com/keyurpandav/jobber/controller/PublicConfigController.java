package com.keyurpandav.jobber.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicConfigController {

    @Value("${app.oauth.google.client-id:}")
    private String googleClientId;

    @GetMapping("/config")
    public Map<String, String> publicConfig() {
        return Map.of(
                "googleClientId", googleClientId == null ? "" : googleClientId.trim()
        );
    }
}
