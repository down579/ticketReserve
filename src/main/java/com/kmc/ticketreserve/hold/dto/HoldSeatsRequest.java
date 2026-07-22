package com.kmc.ticketreserve.hold.dto;

import java.util.List;

public record HoldSeatsRequest(
        String sessionId,
        Long salesId,
        List<Long> seatIds
) {
}
