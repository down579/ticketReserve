package com.kmc.ticketreserve.price.dto;

public record PriceItemResponse(
        Long priceId,
        String seatGrade,
        String seatGradeNm,
        Integer price,
        Integer remainCnt
) {
}
