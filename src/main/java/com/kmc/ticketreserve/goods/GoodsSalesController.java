package com.kmc.ticketreserve.goods;

import com.kmc.ticketreserve.goods.dto.GoodsSalesListResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/goods")
public class GoodsSalesController {

    private final GoodsSalesService goodsSalesService;

    public GoodsSalesController(GoodsSalesService goodsSalesService) {
        this.goodsSalesService = goodsSalesService;
    }

    @GetMapping("/{goodsId}/sales")
    public GoodsSalesListResponse getSales(
            @PathVariable Long goodsId,
            @RequestParam(required = false) String status
    ) {
        return goodsSalesService.getSales(goodsId, status);
    }
}
