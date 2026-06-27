package com.careeros.backend.service;

import com.careeros.backend.config.FileStorageProperties;
import com.careeros.backend.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.UUID;

@Service
@Slf4j
// Swap this for an S3FileStorageService when deploying to production
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalFileStorageService implements FileStorageService {

    private final Path rootLocation;

    public LocalFileStorageService(FileStorageProperties props) {
        this.rootLocation = Paths.get(props.getUploadDir()).toAbsolutePath().normalize();
    }

    @PostConstruct
    void init() {
        try {
            Files.createDirectories(rootLocation);
            log.info("File storage initialized at: {}", rootLocation);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create storage directory: " + rootLocation, e);
        }
    }

    @Override
    public String store(MultipartFile file, UUID userId, String extension) {
        String fileName = UUID.randomUUID() + "." + extension;
        String relativePath = "resumes/" + userId + "/" + fileName;
        Path targetDir = rootLocation.resolve("resumes").resolve(userId.toString());

        try {
            Files.createDirectories(targetDir);
            Path target = targetDir.resolve(fileName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.debug("Stored file: {}", relativePath);
            return relativePath;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file", e);
        }
    }

    @Override
    public Resource load(String storagePath) {
        try {
            Path file = rootLocation.resolve(storagePath).normalize();
            // Path traversal guard
            if (!file.startsWith(rootLocation)) {
                throw new ResourceNotFoundException("File", storagePath);
            }
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("File", storagePath);
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File", storagePath);
        }
    }

    @Override
    public void delete(String storagePath) {
        try {
            Path file = rootLocation.resolve(storagePath).normalize();
            if (!file.startsWith(rootLocation)) return; // safety guard
            Files.deleteIfExists(file);
            log.debug("Deleted file: {}", storagePath);
        } catch (IOException e) {
            log.warn("Could not delete file {}: {}", storagePath, e.getMessage());
        }
    }
}
