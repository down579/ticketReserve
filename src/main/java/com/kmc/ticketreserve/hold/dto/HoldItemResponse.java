package com.kmc.ticketreserve.hold.dto;

public record HoldItemResponse(
        Long holdId,
        Long seatId,
        String seatGrade,
        String floor,
        String rowNo,
        String seatNo,
        String status
) {
}
