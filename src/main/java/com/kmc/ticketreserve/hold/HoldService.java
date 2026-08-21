package com.kmc.ticketreserve.hold;

import com.kmc.ticketreserve.common.ApiException;
import com.kmc.ticketreserve.hold.dto.HoldItemResponse;
import com.kmc.ticketreserve.hold.dto.HoldSeatsRequest;
import com.kmc.ticketreserve.hold.dto.HoldSeatsResponse;
import com.kmc.ticketreserve.seat.SeatMapCacheEvictor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class HoldService {

    private final HoldMapper holdMapper;
    private final SeatMapCacheEvictor seatMapCacheEvictor;
    private final int ttlMinutes;

    public HoldService(
            HoldMapper holdMapper,
            SeatMapCacheEvictor seatMapCacheEvictor,
            @Value("${ticket.seat-hold.ttl-minutes:7}") int ttlMinutes
    ) {
        this.holdMapper = holdMapper;
        this.seatMapCacheEvictor = seatMapCacheEvictor;
        this.ttlMinutes = ttlMinutes;
    }

    @Transactional
    public HoldSeatsResponse holdSeats(HoldSeatsRequest request) {
        if (request.sessionId() == null || request.sessionId().isBlank()) {
            throw ApiException.badRequest("sessionId는 필수입니다.");
        }
        if (request.salesId() == null) {
            throw ApiException.badRequest("salesId는 필수입니다.");
        }
        if (request.seatIds() == null || request.seatIds().isEmpty()) {
            throw ApiException.badRequest("seatIds는 필수입니다.");
        }

        Set<Long> seatIds = new LinkedHashSet<>();
        for (Long seatId : request.seatIds()) {
            if (seatId == null) {
                throw ApiException.badRequest("seatIds에 null이 포함되어 있습니다.");
            }
            seatIds.add(seatId);
        }

        Map<String, Object> session = holdMapper.findActiveSession(request.sessionId());
        if (session == null) {
            throw ApiException.badRequest("유효한 예매 세션이 아닙니다. sessionId=" + request.sessionId());
        }

        Object sessionSalesId = session.get("salesId");
        if (sessionSalesId != null && !Objects.equals(toLong(sessionSalesId), request.salesId())) {
            throw ApiException.badRequest("세션의 회차와 요청 회차가 일치하지 않습니다.");
        }

        Long memberId = toLong(session.get("memberId"));
        LocalDateTime holdExpireAt = LocalDateTime.now().plusMinutes(ttlMinutes);
        List<HoldItemResponse> holds = new ArrayList<>();

        for (Long seatId : seatIds) {
            HoldMapper.SeatLockRow seat = holdMapper.findSeatForUpdate(seatId, request.salesId());
            if (seat == null) {
                throw ApiException.notFound("좌석을 찾을 수 없습니다. seatId=" + seatId);
            }
            if (!"AVAILABLE".equals(seat.seatStatus())) {
                throw ApiException.conflict("선점할 수 없는 좌석입니다. seatId=" + seatId + ", status=" + seat.seatStatus());
            }

            int seatUpdated = holdMapper.updateSeatToHold(seat.seatId(), seat.version());
            if (seatUpdated != 1) {
                throw ApiException.conflict("좌석 선점에 실패했습니다. seatId=" + seatId);
            }

            int stockUpdated = holdMapper.decreaseRemainIncreaseHold(seat.seatassignId());
            if (stockUpdated != 1) {
                throw ApiException.conflict("좌석 재고가 부족합니다. seatId=" + seatId);
            }

            HoldInsertCommand command = new HoldInsertCommand();
            command.setSessionId(request.sessionId());
            command.setMemberId(memberId);
            command.setSalesId(request.salesId());
            command.setSeatId(seatId);
            command.setStatus("HOLD");
            command.setHoldExpireAt(holdExpireAt);

            try {
                holdMapper.insertHold(command);
            } catch (DuplicateKeyException e) {
                throw ApiException.conflict("이미 선점된 좌석입니다. seatId=" + seatId);
            }

            holds.add(new HoldItemResponse(
                    command.getHoldId(),
                    seat.seatId(),
                    seat.seatGrade(),
                    seat.floor(),
                    seat.rowNo(),
                    seat.seatNo(),
                    "HOLD"
            ));
        }

        seatMapCacheEvictor.evictBySalesId(request.salesId());

        return new HoldSeatsResponse(
                request.sessionId(),
                request.salesId(),
                holdExpireAt,
                holds
        );
    }

    private static Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Long longValue) {
            return longValue;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.valueOf(value.toString());
    }
}
