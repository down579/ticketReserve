package com.kmc.ticketreserve.seat;

import com.kmc.ticketreserve.seat.dto.SeatMapResponse;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;

@Component
@ConditionalOnProperty(prefix = "ticket.seat-map", name = "coordinator", havingValue = "local")
public class LocalSeatMapLoadCoordinator implements SeatMapLoadCoordinator {

    private final SeatMapCache seatMapCache;
    private final Counter cacheJoins;
    private final ConcurrentHashMap<String, CompletableFuture<SeatMapResponse>> inflight = new ConcurrentHashMap<>();

    public LocalSeatMapLoadCoordinator(SeatMapCache seatMapCache, MeterRegistry meterRegistry) {
        this.seatMapCache = seatMapCache;
        this.cacheJoins = Counter.builder("ticket.seatmap.cache")
                .description("Seat map cache lookups")
                .tag("result", "join")
                .register(meterRegistry);
    }

    @Override
    public SeatMapResponse coordinate(String cacheKey, SeatMapMissLoader loader) {
        CompletableFuture<SeatMapResponse> created = new CompletableFuture<>();
        CompletableFuture<SeatMapResponse> existing = inflight.putIfAbsent(cacheKey, created);
        if (existing != null) {
            cacheJoins.increment();
            return join(existing);
        }

        try {
            SeatMapResponse cached = getCachedByKey(cacheKey);
            if (cached != null) {
                created.complete(cached);
                return cached;
            }

            SeatMapResponse loaded = loader.load();
            created.complete(loaded);
            return loaded;
        } catch (RuntimeException ex) {
            created.completeExceptionally(ex);
            throw ex;
        } finally {
            inflight.remove(cacheKey, created);
        }
    }

    private SeatMapResponse getCachedByKey(String cacheKey) {
        CacheKeyParts parts = CacheKeyParts.parse(cacheKey);
        if (parts == null) {
            return null;
        }
        return seatMapCache.get(parts.salesId(), parts.seatGrade(), parts.blockCd());
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
}
