package com.kmc.ticketreserve.seat;

import com.kmc.ticketreserve.seat.dto.SeatMapResponse;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Component
@ConditionalOnProperty(prefix = "ticket.seat-map", name = "coordinator", havingValue = "redis")
public class RedisSeatMapLoadCoordinator implements SeatMapLoadCoordinator {

    private static final String LOCK_PREFIX = SeatMapCache.KEY_PREFIX + "lock:";

    private final SeatMapCache seatMapCache;
    private final RedisDistributedLock distributedLock;
    private final Duration lockTtl;
    private final long maxWaitMs;
    private final long pollMs;
    private final Counter lockAcquired;
    private final Counter lockWait;
    private final Counter lockWaitHit;
    private final Counter lockTimeout;

    public RedisSeatMapLoadCoordinator(
            SeatMapCache seatMapCache,
            RedisDistributedLock distributedLock,
            MeterRegistry meterRegistry,
            @Value("${ticket.seat-map.redis-lock-ttl-seconds:15}") long lockTtlSeconds,
            @Value("${ticket.seat-map.redis-lock-wait-ms:10000}") long maxWaitMs,
            @Value("${ticket.seat-map.redis-lock-poll-ms:50}") long pollMs
    ) {
        this.seatMapCache = seatMapCache;
        this.distributedLock = distributedLock;
        this.lockTtl = Duration.ofSeconds(Math.max(lockTtlSeconds, 1));
        this.maxWaitMs = Math.max(maxWaitMs, 0);
        this.pollMs = Math.max(pollMs, 10);
        this.lockAcquired = counter(meterRegistry, "lock_acquired");
        this.lockWait = counter(meterRegistry, "lock_wait");
        this.lockWaitHit = counter(meterRegistry, "lock_wait_hit");
        this.lockTimeout = counter(meterRegistry, "lock_timeout");
    }

    @Override
    public SeatMapResponse coordinate(String cacheKey, SeatMapMissLoader loader) {
        CacheKeyParts parts = CacheKeyParts.parse(cacheKey);
        if (parts == null) {
            return loader.load();
        }

        String lockKey = toLockKey(cacheKey);
        Optional<RedisDistributedLock.LockHandle> handle = distributedLock.tryAcquire(lockKey, lockTtl);
        if (handle.isPresent()) {
            lockAcquired.increment();
            try {
                SeatMapResponse cached = seatMapCache.get(parts.salesId(), parts.seatGrade(), parts.blockCd());
                if (cached != null) {
                    return cached;
                }
                return loader.load();
            } finally {
                distributedLock.release(handle.get());
            }
        }

        lockWait.increment();
        long deadline = System.nanoTime() + maxWaitMs * 1_000_000L;
        while (System.nanoTime() < deadline) {
            SeatMapResponse cached = seatMapCache.get(parts.salesId(), parts.seatGrade(), parts.blockCd());
            if (cached != null) {
                lockWaitHit.increment();
                return cached;
            }
            sleep(pollMs);
        }

        lockTimeout.increment();
        throw new IllegalStateException(
                "Redis lock wait timeout. cacheKey=" + cacheKey + ", waitMs=" + maxWaitMs
        );
    }

    static String toLockKey(String cacheKey) {
        if (cacheKey.startsWith(SeatMapCache.KEY_PREFIX)) {
            return LOCK_PREFIX + cacheKey.substring(SeatMapCache.KEY_PREFIX.length());
        }
        return LOCK_PREFIX + cacheKey;
    }

    private static Counter counter(MeterRegistry meterRegistry, String result) {
        return Counter.builder("ticket.seatmap.coordinator")
                .description("Seat map load coordination")
                .tag("result", result)
                .register(meterRegistry);
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
