package com.kmc.ticketreserve.seat;

import com.kmc.ticketreserve.seat.dto.SeatMapResponse;

public interface SeatMapCache {

    String KEY_PREFIX = "ticketReserve:seatmap:";

    SeatMapResponse get(Long salesId, String seatGrade, String blockCd);

    void put(Long salesId, String seatGrade, String blockCd, SeatMapResponse seatMap);

    void evictBySalesId(Long salesId);

    static String key(Long salesId, String seatGrade, String blockCd) {
        return KEY_PREFIX + salesId + ":" + token(seatGrade) + ":" + token(blockCd);
    }

    private static String token(String value) {
        if (value == null || value.isBlank()) {
            return "_";
        }
        return value;
    }
}
