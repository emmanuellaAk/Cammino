package com.careeros.backend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record AiResumeEditRequest(
        @JsonProperty("mdx_content") String mdxContent,
        @JsonProperty("instruction") String instruction,
        @JsonProperty("chat_history") List<AiChatHistoryEntry> chatHistory
) {}
