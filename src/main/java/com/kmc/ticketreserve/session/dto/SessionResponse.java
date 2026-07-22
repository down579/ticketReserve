package com.kmc.ticketreserve.session.dto;

import java.time.LocalDateTime;

public record SessionResponse(
        String sessionId,
        Long memberId,
        Long goodsId,
        Long salesId,
        String status,
        LocalDateTime expireAt
) {
}
