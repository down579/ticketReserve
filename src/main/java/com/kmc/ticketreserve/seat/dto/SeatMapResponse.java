package com.kmc.ticketreserve.seat.dto;

import java.util.List;

public record SeatMapResponse(
        Long salesId,
        boolean hasBlock,
        List<SeatBlockResponse> blocks
) {
}
