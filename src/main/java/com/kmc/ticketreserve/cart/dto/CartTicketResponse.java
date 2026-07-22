package com.kmc.ticketreserve.cart.dto;

public record CartTicketResponse(
        Long cartTicketId,
        String ticketNo,
        Long seatId,
        String seatGrade,
        String floor,
        String rowNo,
        String seatNo,
        Integer price
) {
}
