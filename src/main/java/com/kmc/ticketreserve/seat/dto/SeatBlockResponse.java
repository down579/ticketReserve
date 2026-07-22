package com.kmc.ticketreserve.seat.dto;

import java.util.List;

public record SeatBlockResponse(
        String blockCd,
        List<SeatItemResponse> seats
) {
}
