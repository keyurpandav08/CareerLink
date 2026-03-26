package com.keyurpandav.jobber.service;

import com.keyurpandav.jobber.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class ResumeStorageService {

    @Value("${app.storage.resume-dir:uploads/resumes}")
    private String resumeDirectory;

    public StoredResume storeResume(User user, MultipartFile resumeFile) {
        if (resumeFile == null || resumeFile.isEmpty()) {
            throw new IllegalArgumentException("Resume file is required");
        }

        String originalFileName = resumeFile.getOriginalFilename() != null
                ? resumeFile.getOriginalFilename().trim()
                : "resume";
        String extension = extractExtension(originalFileName);
        String storedFileName = "resume-user-" + user.getId() + "-" + System.currentTimeMillis() + extension;
        Path storageRoot = Paths.get(resumeDirectory).toAbsolutePath().normalize();
        Path target = storageRoot.resolve(storedFileName).normalize();

        try {
            Files.createDirectories(storageRoot);
            try (InputStream inputStream = resumeFile.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to store resume file", e);
        }

        return new StoredResume(target.toString(), originalFileName);
    }

    public Resource loadAsResource(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            throw new IllegalArgumentException("Resume file path not found");
        }

        Path path = Paths.get(storedPath).toAbsolutePath().normalize();
        Resource resource = new FileSystemResource(path);
        if (!resource.exists()) {
            throw new IllegalArgumentException("Resume file not found");
        }

        return resource;
    }

    public void deleteIfExists(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            return;
        }

        try {
            Files.deleteIfExists(Paths.get(storedPath).toAbsolutePath().normalize());
        } catch (IOException ignored) {
        }
    }

    private String extractExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex < 0 || lastDotIndex == fileName.length() - 1) {
            return ".pdf";
        }

        return fileName.substring(lastDotIndex);
    }

    public record StoredResume(String storagePath, String originalFileName) {
    }
}
