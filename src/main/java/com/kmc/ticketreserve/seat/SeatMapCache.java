package com.kmc.ticketreserve.seat;

import com.kmc.ticketreserve.seat.dto.SeatMapResponse;

public interface SeatMapCache {

    SeatMapResponse get(Long salesId, String seatGrade, String blockCd);

    void put(Long salesId, String seatGrade, String blockCd, SeatMapResponse seatMap);

    void evictBySalesId(Long salesId);
}
