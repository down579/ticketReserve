package com.kmc.ticketreserve.seat;

public enum SeatMapCoordinatorMode {
    NONE,
    LOCAL,
    REDIS;

    public static SeatMapCoordinatorMode from(String raw) {
        if (raw == null || raw.isBlank()) {
            return NONE;
        }
        return SeatMapCoordinatorMode.valueOf(raw.trim().toUpperCase());
    }
}
