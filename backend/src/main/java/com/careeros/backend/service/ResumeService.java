package com.careeros.backend.service;

import com.careeros.backend.config.FileStorageProperties;
import com.careeros.backend.dto.response.ApiResponse;
import com.careeros.backend.dto.response.ResumeResponse;
import com.careeros.backend.entity.Resume;
import com.careeros.backend.entity.User;
import com.careeros.backend.exception.BadRequestException;
import com.careeros.backend.exception.ResourceNotFoundException;
import com.careeros.backend.repository.ResumeRepository;
import com.careeros.backend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeService {

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "docx");
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private final ResumeRepository resumeRepository;
    private final FileStorageService fileStorageService;
    private final FileStorageProperties storageProperties;

    @Transactional
    public ApiResponse<ResumeResponse> upload(MultipartFile file) {
        User user = SecurityUtil.getCurrentUser();

        validateFile(file);

        if (resumeRepository.countByUserId(user.getId()) >= storageProperties.getMaxResumesPerUser()) {
            throw new BadRequestException("Resume limit reached (" + storageProperties.getMaxResumesPerUser() + "). Please delete an existing resume first.");
        }

        String extension = getExtension(file.getOriginalFilename());
        String storagePath = fileStorageService.store(file, user.getId(), extension);

        Resume resume = Resume.builder()
                .user(user)
                .originalFileName(sanitizeFilename(file.getOriginalFilename()))
                .storagePath(storagePath)
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .active(resumeRepository.countByUserId(user.getId()) == 0)
                .build();

        resumeRepository.save(resume);
        log.info("Resume uploaded for user {}: {}", user.getId(), resume.getOriginalFileName());
        return ApiResponse.success("Resume uploaded successfully", ResumeResponse.from(resume));
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<ResumeResponse>> listResumes() {
        User user = SecurityUtil.getCurrentUser();
        List<ResumeResponse> resumes = resumeRepository
                .findAllByUserIdOrderByUploadedAtDesc(user.getId())
                .stream()
                .map(ResumeResponse::from)
                .toList();
        return ApiResponse.success(resumes);
    }

    @Transactional(readOnly = true)
    public ApiResponse<ResumeResponse> getResume(UUID id) {
        User user = SecurityUtil.getCurrentUser();
        Resume resume = findOwned(id, user.getId());
        return ApiResponse.success(ResumeResponse.from(resume));
    }

    public record FileDownload(Resource resource, String filename, String mimeType) {}

    @Transactional(readOnly = true)
    public FileDownload download(UUID id) {
        User user = SecurityUtil.getCurrentUser();
        Resume resume = findOwned(id, user.getId());
        Resource resource = fileStorageService.load(resume.getStoragePath());
        return new FileDownload(resource, resume.getOriginalFileName(), resume.getMimeType());
    }

    @Transactional
    public ApiResponse<ResumeResponse> setActive(UUID id) {
        User user = SecurityUtil.getCurrentUser();
        Resume resume = findOwned(id, user.getId());

        resumeRepository.deactivateAllByUserId(user.getId());
        resume.setActive(true);
        resumeRepository.save(resume);

        return ApiResponse.success("Resume set as active", ResumeResponse.from(resume));
    }

    @Transactional
    public ApiResponse<Void> delete(UUID id) {
        User user = SecurityUtil.getCurrentUser();
        Resume resume = findOwned(id, user.getId());

        fileStorageService.delete(resume.getStoragePath());
        resumeRepository.delete(resume);

        log.info("Resume deleted for user {}: {}", user.getId(), id);
        return ApiResponse.success("Resume deleted");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Resume findOwned(UUID id, UUID userId) {
        return resumeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", id));
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No file provided");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File exceeds the 5 MB size limit");
        }

        String extension = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Only PDF and DOCX files are accepted");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new BadRequestException("Invalid file type. Only PDF and DOCX are accepted");
        }

        validateMagicBytes(file, extension);
    }

    private void validateMagicBytes(MultipartFile file, String extension) {
        try {
            byte[] header = new byte[4];
            int read = file.getInputStream().read(header);
            if (read < 4) throw new BadRequestException("File is too small to be valid");

            boolean isPdf  = header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46; // %PDF
            boolean isZip  = header[0] == 0x50 && header[1] == 0x4B; // PK — DOCX is a ZIP

            if ("pdf".equals(extension) && !isPdf) {
                throw new BadRequestException("File content does not match PDF format");
            }
            if ("docx".equals(extension) && !isZip) {
                throw new BadRequestException("File content does not match DOCX format");
            }
        } catch (IOException e) {
            throw new BadRequestException("Could not read file");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    private String sanitizeFilename(String filename) {
        if (filename == null) return "resume";
        // Strip path separators and null bytes
        return filename.replaceAll("[/\\\\:*?\"<>|\\x00]", "_").trim();
    }
}
