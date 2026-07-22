package com.kmc.ticketreserve.hold;

import java.time.LocalDateTime;

public class HoldInsertCommand {

    private Long holdId;
    private String sessionId;
    private Long memberId;
    private Long salesId;
    private Long seatId;
    private String status;
    private LocalDateTime holdExpireAt;

    public Long getHoldId() {
        return holdId;
    }

    public void setHoldId(Long holdId) {
        this.holdId = holdId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public Long getSalesId() {
        return salesId;
    }

    public void setSalesId(Long salesId) {
        this.salesId = salesId;
    }

    public Long getSeatId() {
        return seatId;
    }

    public void setSeatId(Long seatId) {
        this.seatId = seatId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getHoldExpireAt() {
        return holdExpireAt;
    }

    public void setHoldExpireAt(LocalDateTime holdExpireAt) {
        this.holdExpireAt = holdExpireAt;
    }
}
