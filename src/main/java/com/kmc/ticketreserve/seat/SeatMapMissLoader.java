package com.kmc.ticketreserve.seat;

import com.kmc.ticketreserve.seat.dto.SeatMapResponse;

@FunctionalInterface
public interface SeatMapMissLoader {

    SeatMapResponse load();
}
