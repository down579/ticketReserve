package com.kmc.ticketreserve.price.dto;

import java.util.List;

public record PriceListResponse(
        Long salesId,
        String seatGrade,
        List<PriceItemResponse> prices
) {
}
