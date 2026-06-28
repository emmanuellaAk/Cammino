package com.careeros.backend.dto.response;

import java.time.LocalDate;

public record ApplicationTrendResponse(
        String    period,
        LocalDate periodStart,
        long      count
) {}
