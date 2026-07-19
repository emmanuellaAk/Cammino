package com.careeros.backend.service;

import com.careeros.backend.dto.ai.AiChatHistoryEntry;
import com.careeros.backend.dto.ai.AiResumeEditRequest;
import com.careeros.backend.dto.ai.AiResumeEditResponse;
import com.careeros.backend.dto.request.CreateResumeDraftRequest;
import com.careeros.backend.dto.request.ResumeDraftChatRequest;
import com.careeros.backend.dto.request.UpdateResumeDraftRequest;
import com.careeros.backend.dto.response.*;
import com.careeros.backend.entity.ChatRole;
import com.careeros.backend.entity.ResumeDraft;
import com.careeros.backend.entity.ResumeDraftMessage;
import com.careeros.backend.entity.User;
import com.careeros.backend.exception.ResourceNotFoundException;
import com.careeros.backend.repository.ResumeDraftMessageRepository;
import com.careeros.backend.repository.ResumeDraftRepository;
import com.careeros.backend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeDraftService {

    private static final int MAX_HISTORY_MESSAGES = 12;

    private static final String STARTER_TEMPLATE = """
            <ResumeHeader name='Your Name' title='Your Title' email='you@example.com' phone='+1 000 000 0000' location='City, Country' />

            ## Summary

            A couple of sentences introducing yourself — your focus area, years of experience, and what you're looking for next.

            ## Experience

            <Job title='Job Title' company='Company Name' dates='2023 — Present'>
            - What you built or owned
            - An outcome with a number attached, if you can measure it
            </Job>

            ## Education

            <EduItem degree='Degree, Field of Study' school='University Name' dates='2019 — 2023' />

            ## Skills

            <SkillList items={['Skill one', 'Skill two', 'Skill three']} />
            """;

    private final ResumeDraftRepository draftRepository;
    private final ResumeDraftMessageRepository messageRepository;
    private final AiServiceClient aiServiceClient;

    @Transactional(readOnly = true)
    public ApiResponse<List<ResumeDraftResponse>> list() {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        return ApiResponse.success(
                draftRepository.findAllByUserIdOrderByUpdatedAtDesc(userId)
                        .stream().map(ResumeDraftResponse::from).toList());
    }

    @Transactional
    public ApiResponse<ResumeDraftResponse> create(CreateResumeDraftRequest request) {
        User user = SecurityUtil.getCurrentUser();
        ResumeDraft draft = ResumeDraft.builder()
                .user(user)
                .title(request.title().trim())
                .mdxContent(STARTER_TEMPLATE)
                .build();
        draftRepository.save(draft);
        log.info("Resume draft created for user {}: '{}'", user.getId(), draft.getTitle());
        return ApiResponse.success(ResumeDraftResponse.from(draft));
    }

    @Transactional(readOnly = true)
    public ApiResponse<ResumeDraftResponse> get(UUID id) {
        return ApiResponse.success(ResumeDraftResponse.from(findOwned(id)));
    }

    @Transactional
    public ApiResponse<ResumeDraftResponse> update(UUID id, UpdateResumeDraftRequest request) {
        ResumeDraft draft = findOwned(id);
        if (request.title() != null) draft.setTitle(request.title().trim());
        if (request.mdxContent() != null) draft.setMdxContent(request.mdxContent());
        draftRepository.save(draft);
        return ApiResponse.success("Draft saved", ResumeDraftResponse.from(draft));
    }

    @Transactional
    public ApiResponse<Void> delete(UUID id) {
        ResumeDraft draft = findOwned(id);
        draftRepository.delete(draft);
        return ApiResponse.success("Draft deleted");
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<ResumeDraftMessageResponse>> listMessages(UUID id) {
        ResumeDraft draft = findOwned(id);
        return ApiResponse.success(
                messageRepository.findAllByDraftIdOrderByCreatedAtAsc(draft.getId())
                        .stream().map(ResumeDraftMessageResponse::from).toList());
    }

    @Transactional
    public ApiResponse<ResumeDraftChatResponse> chat(UUID id, ResumeDraftChatRequest request) {
        ResumeDraft draft = findOwned(id);

        List<ResumeDraftMessage> history = messageRepository.findAllByDraftIdOrderByCreatedAtAsc(draft.getId());
        List<AiChatHistoryEntry> historyForAi = history.stream()
                .skip(Math.max(0, history.size() - MAX_HISTORY_MESSAGES))
                .map(m -> new AiChatHistoryEntry(m.getRole().name().toLowerCase(), m.getContent()))
                .toList();

        messageRepository.save(ResumeDraftMessage.builder()
                .draft(draft).role(ChatRole.USER).content(request.message()).build());

        AiResumeEditResponse aiResponse = aiServiceClient.editResume(
                new AiResumeEditRequest(draft.getMdxContent(), request.message(), historyForAi));

        draft.setMdxContent(aiResponse.updatedMdxContent());
        draftRepository.save(draft);

        ResumeDraftMessage assistantMessage = messageRepository.save(ResumeDraftMessage.builder()
                .draft(draft).role(ChatRole.ASSISTANT).content(aiResponse.reply()).build());

        log.info("Resume draft {} edited via chat for user {}", draft.getId(), draft.getUser().getId());
        return ApiResponse.success(new ResumeDraftChatResponse(
                ResumeDraftMessageResponse.from(assistantMessage),
                ResumeDraftResponse.from(draft)));
    }

    private ResumeDraft findOwned(UUID id) {
        UUID userId = SecurityUtil.getCurrentUser().getId();
        return draftRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume draft", id));
    }
}
