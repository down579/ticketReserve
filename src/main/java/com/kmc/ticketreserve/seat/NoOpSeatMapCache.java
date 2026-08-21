package com.kmc.ticketreserve.seat;

import com.kmc.ticketreserve.seat.dto.SeatMapResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "ticket.seat-map", name = "cache-enabled", havingValue = "false")
public class NoOpSeatMapCache implements SeatMapCache {

    @Override
    public SeatMapResponse get(Long salesId, String seatGrade, String blockCd) {
        return null;
    }

    @Override
    public void put(Long salesId, String seatGrade, String blockCd, SeatMapResponse seatMap) {
    }

    @Override
    public void evictBySalesId(Long salesId) {
    }
}
