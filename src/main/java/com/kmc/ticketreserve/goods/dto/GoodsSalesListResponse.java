package com.kmc.ticketreserve.goods.dto;

import java.util.List;

public record GoodsSalesListResponse(
        Long goodsId,
        String goodsNm,
        List<SalesItemResponse> sales
) {
}
