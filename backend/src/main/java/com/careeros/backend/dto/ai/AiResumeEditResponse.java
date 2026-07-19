package com.careeros.backend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AiResumeEditResponse(
        @JsonProperty("reply") String reply,
        @JsonProperty("updated_mdx_content") String updatedMdxContent
) {}
