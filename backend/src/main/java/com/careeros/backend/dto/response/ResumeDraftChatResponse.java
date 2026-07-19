package com.careeros.backend.dto.response;

public record ResumeDraftChatResponse(
        ResumeDraftMessageResponse assistantMessage,
        ResumeDraftResponse draft
) {}
