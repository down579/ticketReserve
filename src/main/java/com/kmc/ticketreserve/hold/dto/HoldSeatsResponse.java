package com.kmc.ticketreserve.hold.dto;

import java.time.LocalDateTime;
import java.util.List;

public record HoldSeatsResponse(
        String sessionId,
        Long salesId,
        LocalDateTime holdExpireAt,
        List<HoldItemResponse> holds
) {
}
