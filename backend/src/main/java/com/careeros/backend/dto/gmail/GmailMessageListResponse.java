package com.careeros.backend.dto.gmail;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GmailMessageListResponse(
        @JsonProperty("messages") List<MessageRef> messages,
        @JsonProperty("resultSizeEstimate") Integer resultSizeEstimate
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MessageRef(
            @JsonProperty("id") String id,
            @JsonProperty("threadId") String threadId
    ) {}
}
