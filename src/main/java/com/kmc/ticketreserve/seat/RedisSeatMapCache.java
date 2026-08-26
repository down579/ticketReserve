package com.kmc.ticketreserve.seat;

import com.kmc.ticketreserve.seat.dto.SeatMapResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.Set;

@Component
@ConditionalOnProperty(prefix = "ticket.seat-map", name = "cache-enabled", havingValue = "true", matchIfMissing = true)
public class RedisSeatMapCache implements SeatMapCache {

    private static final String KEY_PREFIX = SeatMapCache.KEY_PREFIX;

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration ttl;

    public RedisSeatMapCache(
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Value("${ticket.seat-map.ttl-seconds:3}") long ttlSeconds
    ) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.ttl = Duration.ofSeconds(Math.max(ttlSeconds, 1));
    }

    @Override
    public SeatMapResponse get(Long salesId, String seatGrade, String blockCd) {
        String json = redisTemplate.opsForValue().get(SeatMapCache.key(salesId, seatGrade, blockCd));
        if (json == null || json.isBlank()) {
            return null;
        }
        return objectMapper.readValue(json, SeatMapResponse.class);
    }

    @Override
    public void put(Long salesId, String seatGrade, String blockCd, SeatMapResponse seatMap) {
        redisTemplate.opsForValue().set(
                SeatMapCache.key(salesId, seatGrade, blockCd),
                objectMapper.writeValueAsString(seatMap),
                ttl
        );
    }

    @Override
    public void evictBySalesId(Long salesId) {
        if (salesId == null) {
            return;
        }
        Set<String> keys = redisTemplate.keys(KEY_PREFIX + salesId + ":*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
