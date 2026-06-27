package com.careeros.backend.dto.gmail;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GmailMessageDetail(
        @JsonProperty("id") String id,
        @JsonProperty("snippet") String snippet,
        @JsonProperty("internalDate") Long internalDate,
        @JsonProperty("payload") Payload payload
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Payload(
            @JsonProperty("headers") List<Header> headers
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Header(
            @JsonProperty("name") String name,
            @JsonProperty("value") String value
    ) {}
}
