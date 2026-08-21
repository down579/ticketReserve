package com.kmc.ticketreserve.seat;

import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class SeatMapCacheEvictor {

    private final SeatMapCache seatMapCache;

    public SeatMapCacheEvictor(SeatMapCache seatMapCache) {
        this.seatMapCache = seatMapCache;
    }

    public void evictBySalesId(Long salesId) {
        if (salesId == null) {
            return;
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    seatMapCache.evictBySalesId(salesId);
                }
            });
            return;
        }
        seatMapCache.evictBySalesId(salesId);
    }
}
