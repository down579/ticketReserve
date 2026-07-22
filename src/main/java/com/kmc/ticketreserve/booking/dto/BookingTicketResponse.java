package com.kmc.ticketreserve.booking.dto;

public record BookingTicketResponse(
        Long bookingTicketId,
        String ticketNo,
        Long seatId,
        String seatGrade,
        String floor,
        String rowNo,
        String seatNo,
        Integer price,
        String ticketStatus
) {
}
