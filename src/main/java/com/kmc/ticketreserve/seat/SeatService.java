package com.kmc.ticketreserve.seat;

import com.kmc.ticketreserve.seat.dto.SeatMapResponse;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SeatService {

    private static final Logger log = LoggerFactory.getLogger(SeatService.class);

    private final SeatMapLoader seatMapLoader;
    private final SeatMapCache seatMapCache;
    private final SeatMapLoadCoordinator loadCoordinator;
    private final long missDelayMs;
    private final Counter cacheHits;
    private final Counter cacheMisses;

    public SeatService(
            SeatMapLoader seatMapLoader,
            SeatMapCache seatMapCache,
            SeatMapLoadCoordinator loadCoordinator,
            MeterRegistry meterRegistry,
            @Value("${ticket.seat-map.miss-delay-ms:0}") long missDelayMs,
            @Value("${ticket.seat-map.coordinator:none}") String coordinatorMode
    ) {
        this.seatMapLoader = seatMapLoader;
        this.seatMapCache = seatMapCache;
        this.loadCoordinator = loadCoordinator;
        this.missDelayMs = Math.max(missDelayMs, 0);
        this.cacheHits = Counter.builder("ticket.seatmap.cache")
                .description("Seat map cache lookups")
                .tag("result", "hit")
                .register(meterRegistry);
        this.cacheMisses = Counter.builder("ticket.seatmap.cache")
                .description("Seat map cache lookups")
                .tag("result", "miss")
                .register(meterRegistry);
        log.info("seat-map coordinator={}", SeatMapCoordinatorMode.from(coordinatorMode));
    }

    public SeatMapResponse getSeatMap(Long salesId, String seatGrade, String blockCd) {
        SeatMapResponse cached = seatMapCache.get(salesId, seatGrade, blockCd);
        if (cached != null) {
            cacheHits.increment();
            return cached;
        }

        String cacheKey = SeatMapCache.key(salesId, seatGrade, blockCd);
        return loadCoordinator.coordinate(cacheKey, () -> loadMiss(salesId, seatGrade, blockCd));
    }

    private SeatMapResponse loadMiss(Long salesId, String seatGrade, String blockCd) {
        cacheMisses.increment();
        delayOnMiss();
        SeatMapResponse seatMap = seatMapLoader.load(salesId, seatGrade, blockCd);
        seatMapCache.put(salesId, seatGrade, blockCd, seatMap);
        return seatMap;
    }

    private void delayOnMiss() {
        if (missDelayMs <= 0) {
            return;
        }
        try {
            Thread.sleep(missDelayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
