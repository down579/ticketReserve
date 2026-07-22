package com.kmc.ticketreserve.price;

import com.kmc.ticketreserve.common.ApiException;
import com.kmc.ticketreserve.price.dto.PriceItemResponse;
import com.kmc.ticketreserve.price.dto.PriceListResponse;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class PriceService {

    private final PriceMapper priceMapper;

    public PriceService(PriceMapper priceMapper) {
        this.priceMapper = priceMapper;
    }

    public PriceListResponse getPrices(Long salesId, String seatGrade) {
        if (seatGrade == null || seatGrade.isBlank()) {
            throw ApiException.badRequest("seatGrade는 필수입니다.");
        }

        Map<String, Object> sales = priceMapper.findSales(salesId);
        if (sales == null) {
            throw ApiException.notFound("회차를 찾을 수 없습니다. salesId=" + salesId);
        }

        List<PriceItemResponse> prices = priceMapper.findPricesByGrade(salesId, seatGrade);
        return new PriceListResponse(salesId, seatGrade, prices);
    }
}
