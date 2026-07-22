package com.kmc.ticketreserve.cart.dto;

import java.util.List;

public record CreateCartRequest(
        String sessionId,
        Long goodsId,
        Long salesId,
        List<Long> seatIds
) {
}
