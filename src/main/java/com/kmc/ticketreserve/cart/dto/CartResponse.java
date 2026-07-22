package com.kmc.ticketreserve.cart.dto;

import java.time.LocalDateTime;
import java.util.List;

public record CartResponse(
        Long cartId,
        String reserveNo,
        String sessionId,
        Long memberId,
        Long goodsId,
        String goodsNm,
        Long salesId,
        String playDt,
        String playTm,
        Integer ticketCnt,
        Integer totalAmt,
        String status,
        LocalDateTime expireAt,
        List<CartTicketResponse> tickets
) {
}
