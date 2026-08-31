package com.kmc.ticketreserve.seat;

final class CacheKeyParts {

    private final Long salesId;
    private final String seatGrade;
    private final String blockCd;

    private CacheKeyParts(Long salesId, String seatGrade, String blockCd) {
        this.salesId = salesId;
        this.seatGrade = seatGrade;
        this.blockCd = blockCd;
    }

    Long salesId() {
        return salesId;
    }

    String seatGrade() {
        return seatGrade;
    }

    String blockCd() {
        return blockCd;
    }

    static CacheKeyParts parse(String cacheKey) {
        if (cacheKey == null || !cacheKey.startsWith(SeatMapCache.KEY_PREFIX)) {
            return null;
        }
        String suffix = cacheKey.substring(SeatMapCache.KEY_PREFIX.length());
        String[] tokens = suffix.split(":", 3);
        if (tokens.length != 3) {
            return null;
        }
        try {
            Long salesId = Long.parseLong(tokens[0]);
            return new CacheKeyParts(salesId, detoken(tokens[1]), detoken(tokens[2]));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static String detoken(String value) {
        if ("_".equals(value)) {
            return null;
        }
        return value;
    }
}
