package com.kmc.ticketreserve.seat;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@ConditionalOnBean(StringRedisTemplate.class)
public class RedisDistributedLock {

    private static final DefaultRedisScript<Long> RELEASE_SCRIPT = new DefaultRedisScript<>(
            """
                    if redis.call('get', KEYS[1]) == ARGV[1] then
                      return redis.call('del', KEYS[1])
                    else
                      return 0
                    end
                    """,
            Long.class
    );

    private final StringRedisTemplate redisTemplate;

    public RedisDistributedLock(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public Optional<LockHandle> tryAcquire(String lockKey, Duration ttl) {
        String token = UUID.randomUUID().toString();
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, token, ttl);
        if (Boolean.TRUE.equals(acquired)) {
            return Optional.of(new LockHandle(lockKey, token));
        }
        return Optional.empty();
    }

    public void release(LockHandle handle) {
        redisTemplate.execute(RELEASE_SCRIPT, List.of(handle.lockKey()), handle.token());
    }

    public record LockHandle(String lockKey, String token) {
    }
}
