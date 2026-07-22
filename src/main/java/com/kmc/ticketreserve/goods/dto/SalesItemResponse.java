package com.kmc.ticketreserve.goods.dto;

public record SalesItemResponse(
        Long salesId,
        String playDt,
        String playTm,
        Integer playSeq,
        String status,
        Integer remainCnt
) {
}
