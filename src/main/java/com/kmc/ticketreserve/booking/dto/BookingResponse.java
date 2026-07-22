package com.kmc.ticketreserve.booking.dto;

import java.time.LocalDateTime;
import java.util.List;

public record BookingResponse(
        Long bookingId,
        String bookingNo,
        Long cartId,
        Long memberId,
        Long goodsId,
        Long salesId,
        Integer ticketCnt,
        Integer totalAmt,
        Integer payAmt,
        String payStatus,
        String bookingStatus,
        LocalDateTime bookedAt,
        List<BookingTicketResponse> tickets
) {
}
