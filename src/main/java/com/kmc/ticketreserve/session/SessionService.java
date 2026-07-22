package com.kmc.ticketreserve.session;

import com.kmc.ticketreserve.common.ApiException;
import com.kmc.ticketreserve.session.dto.CreateSessionRequest;
import com.kmc.ticketreserve.session.dto.SessionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class SessionService {

    private final SessionMapper sessionMapper;
    private final int ttlMinutes;

    public SessionService(
            SessionMapper sessionMapper,
            @Value("${ticket.session.ttl-minutes:10}") int ttlMinutes
    ) {
        this.sessionMapper = sessionMapper;
        this.ttlMinutes = ttlMinutes;
    }

    @Transactional
    public SessionResponse create(CreateSessionRequest request) {
        if (request.memberId() == null) {
            throw ApiException.badRequest("memberId는 필수입니다.");
        }
        if (request.goodsId() == null) {
            throw ApiException.badRequest("goodsId는 필수입니다.");
        }

        Map<String, Object> member = sessionMapper.findActiveMember(request.memberId());
        if (member == null) {
            throw ApiException.notFound("회원을 찾을 수 없습니다. memberId=" + request.memberId());
        }

        Map<String, Object> goods = sessionMapper.findGoods(request.goodsId());
        if (goods == null) {
            throw ApiException.notFound("상품을 찾을 수 없습니다. goodsId=" + request.goodsId());
        }
        if (!"ON_SALE".equals(String.valueOf(goods.get("status")))) {
            throw ApiException.badRequest("판매 중이 아닌 상품입니다. goodsId=" + request.goodsId());
        }

        if (request.salesId() != null) {
            Map<String, Object> sales = sessionMapper.findOpenSales(request.salesId(), request.goodsId());
            if (sales == null) {
                throw ApiException.badRequest(
                        "유효한 회차가 아닙니다. salesId=" + request.salesId() + ", goodsId=" + request.goodsId()
                );
            }
        }

        String sessionId = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime expireAt = LocalDateTime.now().plusMinutes(ttlMinutes);
        String status = "ACTIVE";

        sessionMapper.insertSession(
                sessionId,
                request.memberId(),
                request.goodsId(),
                request.salesId(),
                status,
                expireAt
        );

        return new SessionResponse(
                sessionId,
                request.memberId(),
                request.goodsId(),
                request.salesId(),
                status,
                expireAt
        );
    }
}
