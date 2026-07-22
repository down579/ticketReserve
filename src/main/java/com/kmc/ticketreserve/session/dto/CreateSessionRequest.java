package com.kmc.ticketreserve.session.dto;

public record CreateSessionRequest(
        Long memberId,
        Long goodsId,
        Long salesId
) {
}
