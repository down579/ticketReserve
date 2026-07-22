package com.kmc.ticketreserve.seat.dto;

public record SeatItemResponse(
        Long seatId,
        String seatGrade,
        String floor,
        String rowNo,
        String seatNo,
        String seatStatus
) {
}
