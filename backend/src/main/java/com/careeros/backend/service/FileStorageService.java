package com.careeros.backend.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface FileStorageService {

    /**
     * Stores the file and returns a stable relative storage path.
     * The path is safe to persist in the database.
     */
    String store(MultipartFile file, UUID userId, String extension);

    /**
     * Loads a stored file as a Spring Resource for streaming.
     */
    Resource load(String storagePath);

    /**
     * Deletes the file at the given storage path. No-op if it doesn't exist.
     */
    void delete(String storagePath);
}
