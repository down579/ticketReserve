package com.kmc.ticketreserve.booking.dto;

import java.util.List;

public record CancelAllBookingsResponse(
        int cancelledCount,
        List<CancelBookingResponse> bookings
) {
}
