package com.kmc.ticketreserve.seat;

import com.kmc.ticketreserve.seat.dto.SeatMapResponse;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SeatService {

    private final SeatMapLoader seatMapLoader;
    private final SeatMapCache seatMapCache;
    private final long missDelayMs;
    private final boolean singleFlightEnabled;
    private final Counter cacheHits;
    private final Counter cacheMisses;
    private final Counter cacheJoins;
    private final ConcurrentHashMap<String, CompletableFuture<SeatMapResponse>> inflight = new ConcurrentHashMap<>();

    public SeatService(
            SeatMapLoader seatMapLoader,
            SeatMapCache seatMapCache,
            MeterRegistry meterRegistry,
            @Value("${ticket.seat-map.miss-delay-ms:0}") long missDelayMs,
            @Value("${ticket.seat-map.single-flight-enabled:true}") boolean singleFlightEnabled
    ) {
        this.seatMapLoader = seatMapLoader;
        this.seatMapCache = seatMapCache;
        this.missDelayMs = Math.max(missDelayMs, 0);
        this.singleFlightEnabled = singleFlightEnabled;
        this.cacheHits = Counter.builder("ticket.seatmap.cache")
                .description("Seat map cache lookups")
                .tag("result", "hit")
                .register(meterRegistry);
        this.cacheMisses = Counter.builder("ticket.seatmap.cache")
                .description("Seat map cache lookups")
                .tag("result", "miss")
                .register(meterRegistry);
        this.cacheJoins = Counter.builder("ticket.seatmap.cache")
                .description("Seat map cache lookups")
                .tag("result", "join")
                .register(meterRegistry);
    }

    public SeatMapResponse getSeatMap(Long salesId, String seatGrade, String blockCd) {
        SeatMapResponse cached = seatMapCache.get(salesId, seatGrade, blockCd);
        if (cached != null) {
            cacheHits.increment();
            return cached;
        }

        if (!singleFlightEnabled) {
            return loadMiss(salesId, seatGrade, blockCd);
        }

        String key = SeatMapCache.key(salesId, seatGrade, blockCd);
        CompletableFuture<SeatMapResponse> created = new CompletableFuture<>();
        CompletableFuture<SeatMapResponse> existing = inflight.putIfAbsent(key, created);
        if (existing != null) {
            cacheJoins.increment();
            return join(existing);
        }

        try {
            SeatMapResponse again = seatMapCache.get(salesId, seatGrade, blockCd);
            if (again != null) {
                cacheHits.increment();
                created.complete(again);
                return again;
            }

            SeatMapResponse loaded = loadMiss(salesId, seatGrade, blockCd);
            created.complete(loaded);
            return loaded;
        } catch (RuntimeException ex) {
            created.completeExceptionally(ex);
            throw ex;
        } finally {
            inflight.remove(key, created);
        }
    }

    private SeatMapResponse loadMiss(Long salesId, String seatGrade, String blockCd) {
        cacheMisses.increment();
        delayOnMiss();
        SeatMapResponse seatMap = seatMapLoader.load(salesId, seatGrade, blockCd);
        seatMapCache.put(salesId, seatGrade, blockCd, seatMap);
        return seatMap;
    }

    private static SeatMapResponse join(CompletableFuture<SeatMapResponse> future) {
        try {
            return future.join();
        } catch (CompletionException ex) {
            Throwable cause = ex.getCause();
            if (cause instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw ex;
        }
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
