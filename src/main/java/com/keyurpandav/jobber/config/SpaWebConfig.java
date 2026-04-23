package com.keyurpandav.jobber.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/index.html");
        registry.addViewController("/login").setViewName("forward:/index.html");
        registry.addViewController("/register").setViewName("forward:/index.html");
        registry.addViewController("/jobs").setViewName("forward:/index.html");
        registry.addViewController("/jobs/{id}").setViewName("forward:/index.html");
        registry.addViewController("/privacy-policy").setViewName("forward:/index.html");
        registry.addViewController("/terms").setViewName("forward:/index.html");
        registry.addViewController("/contact").setViewName("forward:/index.html");
        registry.addViewController("/career-advice").setViewName("forward:/index.html");
        registry.addViewController("/resume-builder").setViewName("forward:/index.html");
        registry.addViewController("/interview-tips").setViewName("forward:/index.html");
        registry.addViewController("/talent-search").setViewName("forward:/index.html");
        registry.addViewController("/forgot-password").setViewName("forward:/index.html");
        registry.addViewController("/dashboard").setViewName("forward:/index.html");
        registry.addViewController("/employer-dashboard").setViewName("forward:/index.html");
        registry.addViewController("/employer-dashboard/jobs").setViewName("forward:/index.html");
        registry.addViewController("/employer-dashboard/candidates").setViewName("forward:/index.html");
        registry.addViewController("/employer-dashboard/pipeline").setViewName("forward:/index.html");
        registry.addViewController("/employer-dashboard/analytics").setViewName("forward:/index.html");
        registry.addViewController("/profile").setViewName("forward:/index.html");
        registry.addViewController("/edit-profile").setViewName("forward:/index.html");
        registry.addViewController("/applications").setViewName("forward:/index.html");
        registry.addViewController("/settings").setViewName("forward:/index.html");
        registry.addViewController("/saved-jobs").setViewName("forward:/index.html");
        registry.addViewController("/post-job").setViewName("forward:/index.html");
        registry.addViewController("/application/{id}").setViewName("forward:/index.html");
        registry.addViewController("/offer-details").setViewName("forward:/index.html");
        registry.addViewController("/admin").setViewName("forward:/index.html");
        registry.addViewController("/admin/login").setViewName("forward:/index.html");
        registry.addViewController("/admin/dashboard").setViewName("forward:/index.html");
    }
}
