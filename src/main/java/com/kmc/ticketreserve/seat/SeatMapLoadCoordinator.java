package com.kmc.ticketreserve.seat;

import com.kmc.ticketreserve.seat.dto.SeatMapResponse;

@FunctionalInterface
public interface SeatMapLoadCoordinator {

    /**
     * 캐시 miss 시 DB 로드를 조율한다. {@code loader}는 miss 카운트·지연·DB·캐시 put을 포함한다.
     */
    SeatMapResponse coordinate(String cacheKey, SeatMapMissLoader loader);
}
