package com.kmc.ticketreserve.booking.dto;

import java.time.LocalDateTime;

public record CancelBookingResponse(
        Long bookingId,
        String bookingNo,
        String bookingStatus,
        String payStatus,
        Integer ticketCnt,
        LocalDateTime cancelledAt
) {
}
