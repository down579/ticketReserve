package com.kmc.ticketreserve.hold;

/**
 * 좌석 선점 락 전략.
 * <ul>
 *   <li>{@link #PESSIMISTIC} — SELECT … FOR UPDATE 후 version CAS</li>
 *   <li>{@link #OPTIMISTIC} — 일반 SELECT 후 version CAS (경합 시 즉시 409)</li>
 * </ul>
 */
public enum SeatHoldLockMode {
    PESSIMISTIC,
    OPTIMISTIC;

    public boolean useForUpdate() {
        return this == PESSIMISTIC;
    }

    public static SeatHoldLockMode from(String raw) {
        if (raw == null || raw.isBlank()) {
            return PESSIMISTIC;
        }
        return SeatHoldLockMode.valueOf(raw.trim().toUpperCase());
    }
}
