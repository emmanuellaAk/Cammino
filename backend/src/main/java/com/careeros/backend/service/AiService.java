package com.careeros.backend.service;

import com.careeros.backend.dto.ai.AiJobMatchRequest;
import com.careeros.backend.dto.ai.AiJobMatchResponse;
import com.careeros.backend.dto.ai.AiResumeRequest;
import com.careeros.backend.dto.ai.AiResumeResponse;
import com.careeros.backend.dto.response.ApiResponse;
import com.careeros.backend.dto.response.JobMatchResponse;
import com.careeros.backend.dto.response.ResumeAnalysisResponse;
import com.careeros.backend.entity.*;
import com.careeros.backend.exception.BadRequestException;
import com.careeros.backend.exception.ResourceNotFoundException;
import com.careeros.backend.exception.ServiceUnavailableException;
import com.careeros.backend.repository.*;
import com.careeros.backend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final AiServiceClient aiServiceClient;
    private final ResumeRepository resumeRepository;
    private final ResumeAnalysisRepository analysisRepository;
    private final JobRepository jobRepository;
    private final JobMatchRepository jobMatchRepository;
    private final FileStorageService fileStorageService;

    // ─── Resume Analysis ─────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<ResumeAnalysisResponse> analyzeResume() {
        User user = SecurityUtil.getCurrentUser();
        Resume resume = getActiveResume(user.getId());

        String base64 = encodeResumeToBase64(resume);
        AiResumeRequest request = new AiResumeRequest(base64, resume.getMimeType());

        try {
            AiResumeResponse aiResponse = aiServiceClient.analyzeResume(request);

            analysisRepository.deleteByResumeId(resume.getId());
            ResumeAnalysis analysis = ResumeAnalysis.builder()
                    .resume(resume)
                    .user(user)
                    .skills(aiResponse.skills())
                    .experienceYears(aiResponse.experienceYears())
                    .education(aiResponse.education())
                    .strengths(aiResponse.strengths())
                    .summary(aiResponse.summary())
                    .build();
            analysisRepository.save(analysis);

            log.info("Resume analysis completed for user {}", user.getId());
            return ApiResponse.success("Resume analysed successfully", ResumeAnalysisResponse.from(analysis));

        } catch (ServiceUnavailableException e) {
            return analysisRepository.findByResumeId(resume.getId())
                    .map(cached -> ApiResponse.success(
                            "AI service temporarily unavailable — returning cached analysis",
                            ResumeAnalysisResponse.from(cached)))
                    .orElseThrow(() -> e);
        }
    }

    @Transactional(readOnly = true)
    public ApiResponse<ResumeAnalysisResponse> getAnalysis() {
        User user = SecurityUtil.getCurrentUser();
        Resume resume = getActiveResume(user.getId());

        ResumeAnalysis analysis = analysisRepository.findByResumeId(resume.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No analysis found. Use POST /api/ai/resume/analyze to generate one."));
        return ApiResponse.success(ResumeAnalysisResponse.from(analysis));
    }

    // ─── Job Match ────────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<JobMatchResponse> matchJob(UUID jobId) {
        User user = SecurityUtil.getCurrentUser();
        Resume resume = getActiveResume(user.getId());
        Job job = findOwnedJob(jobId, user.getId());

        String base64 = encodeResumeToBase64(resume);
        AiJobMatchRequest request = new AiJobMatchRequest(
                base64,
                resume.getMimeType(),
                job.getJobTitle(),
                job.getCompany(),
                job.getLocation(),
                job.getDescription()
        );

        try {
            AiJobMatchResponse aiResponse = aiServiceClient.matchJob(request);

            jobMatchRepository.deleteByJobIdAndResumeId(job.getId(), resume.getId());
            JobMatch match = JobMatch.builder()
                    .job(job)
                    .resume(resume)
                    .user(user)
                    .matchScore(aiResponse.matchScore())
                    .matchingSkills(aiResponse.matchingSkills())
                    .missingSkills(aiResponse.missingSkills())
                    .recommendations(aiResponse.recommendations())
                    .summary(aiResponse.summary())
                    .build();
            jobMatchRepository.save(match);

            log.info("Job match completed for user {} — job {} score {}", user.getId(), jobId, aiResponse.matchScore());
            return ApiResponse.success("Job match completed", JobMatchResponse.from(match));

        } catch (ServiceUnavailableException e) {
            return jobMatchRepository.findTopByJobIdAndUserIdOrderByAnalyzedAtDesc(jobId, user.getId())
                    .map(cached -> ApiResponse.success(
                            "AI service temporarily unavailable — returning cached match",
                            JobMatchResponse.from(cached)))
                    .orElseThrow(() -> e);
        }
    }

    @Transactional(readOnly = true)
    public ApiResponse<JobMatchResponse> getMatch(UUID jobId) {
        User user = SecurityUtil.getCurrentUser();
        findOwnedJob(jobId, user.getId());

        JobMatch match = jobMatchRepository.findTopByJobIdAndUserIdOrderByAnalyzedAtDesc(jobId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No match found. Use POST /api/ai/jobs/{id}/match to generate one."));
        return ApiResponse.success(JobMatchResponse.from(match));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Resume getActiveResume(UUID userId) {
        return resumeRepository.findByUserIdAndActiveTrue(userId)
                .orElseThrow(() -> new BadRequestException(
                        "No active resume found. Please upload and activate a resume first."));
    }

    private Job findOwnedJob(UUID jobId, UUID userId) {
        return jobRepository.findByIdAndUserId(jobId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));
    }

    private String encodeResumeToBase64(Resume resume) {
        Resource resource = fileStorageService.load(resume.getStoragePath());
        try (InputStream is = resource.getInputStream()) {
            return Base64.getEncoder().encodeToString(is.readAllBytes());
        } catch (IOException e) {
            log.error("Failed to read resume file: {}", resume.getStoragePath(), e);
            throw new BadRequestException("Could not read resume file");
        }
    }
}
