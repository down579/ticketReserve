package com.kmc.ticketreserve.price;

import com.kmc.ticketreserve.price.dto.PriceListResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales")
public class PriceController {

    private final PriceService priceService;

    public PriceController(PriceService priceService) {
        this.priceService = priceService;
    }

    @GetMapping("/{salesId}/prices")
    public PriceListResponse getPrices(
            @PathVariable Long salesId,
            @RequestParam String seatGrade
    ) {
        return priceService.getPrices(salesId, seatGrade);
    }
}
