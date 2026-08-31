package com.kmc.ticketreserve.seat;

import com.kmc.ticketreserve.seat.dto.SeatMapResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "ticket.seat-map", name = "coordinator", havingValue = "none", matchIfMissing = true)
public class NoneSeatMapLoadCoordinator implements SeatMapLoadCoordinator {

    @Override
    public SeatMapResponse coordinate(String cacheKey, SeatMapMissLoader loader) {
        return loader.load();
    }
}
