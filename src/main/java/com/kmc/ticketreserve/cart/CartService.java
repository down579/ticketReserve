package com.kmc.ticketreserve.cart;

import com.kmc.ticketreserve.cart.dto.CartResponse;
import com.kmc.ticketreserve.cart.dto.CartTicketResponse;
import com.kmc.ticketreserve.cart.dto.CreateCartRequest;
import com.kmc.ticketreserve.common.ApiException;
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
public class CartService {

    private final CartMapper cartMapper;

    public CartService(CartMapper cartMapper) {
        this.cartMapper = cartMapper;
    }

    @Transactional
    public CartResponse create(CreateCartRequest request) {
        if (request.sessionId() == null || request.sessionId().isBlank()) {
            throw ApiException.badRequest("sessionId는 필수입니다.");
        }
        if (request.goodsId() == null) {
            throw ApiException.badRequest("goodsId는 필수입니다.");
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

        Map<String, Object> session = cartMapper.findActiveSession(request.sessionId());
        if (session == null) {
            throw ApiException.badRequest("유효한 예매 세션이 아닙니다. sessionId=" + request.sessionId());
        }

        Long memberId = toLong(session.get("memberId"));
        Object sessionGoodsId = session.get("goodsId");
        if (sessionGoodsId != null && !Objects.equals(toLong(sessionGoodsId), request.goodsId())) {
            throw ApiException.badRequest("세션의 상품과 요청 상품이 일치하지 않습니다.");
        }
        Object sessionSalesId = session.get("salesId");
        if (sessionSalesId != null && !Objects.equals(toLong(sessionSalesId), request.salesId())) {
            throw ApiException.badRequest("세션의 회차와 요청 회차가 일치하지 않습니다.");
        }

        String goodsNm = cartMapper.findGoodsNm(request.goodsId());
        if (goodsNm == null) {
            throw ApiException.notFound("상품을 찾을 수 없습니다. goodsId=" + request.goodsId());
        }

        Map<String, Object> sales = cartMapper.findSalesPlayInfo(request.salesId());
        if (sales == null) {
            throw ApiException.notFound("회차를 찾을 수 없습니다. salesId=" + request.salesId());
        }
        if (!Objects.equals(toLong(sales.get("goodsId")), request.goodsId())) {
            throw ApiException.badRequest("상품과 회차가 일치하지 않습니다.");
        }

        List<CartMapper.HoldSeatPriceRow> holdSeats = new ArrayList<>();
        LocalDateTime expireAt = null;
        int totalAmt = 0;

        for (Long seatId : seatIds) {
            CartMapper.HoldSeatPriceRow row = cartMapper.findHoldSeatWithPrice(
                    request.sessionId(),
                    request.salesId(),
                    seatId
            );
            if (row == null) {
                throw ApiException.conflict("유효한 선점 좌석이 아닙니다. seatId=" + seatId);
            }
            if (row.price() == null) {
                throw ApiException.badRequest(
                        "좌석 등급 가격이 없습니다. seatId=" + seatId + ", seatGrade=" + row.seatGrade()
                );
            }
            holdSeats.add(row);
            totalAmt += row.price();
            if (expireAt == null || row.holdExpireAt().isBefore(expireAt)) {
                expireAt = row.holdExpireAt();
            }
        }

        cartMapper.expireActiveCartsBySession(request.sessionId());

        CartMasterInsertCommand master = new CartMasterInsertCommand();
        master.setMemberId(memberId);
        master.setSessionId(request.sessionId());
        master.setGoodsId(request.goodsId());
        master.setSalesId(request.salesId());
        master.setTicketCnt(holdSeats.size());
        master.setTotalAmt(totalAmt);
        master.setStatus("ACTIVE");
        master.setExpireAt(expireAt);
        cartMapper.insertCartMaster(master);

        String reserveNo = "T"
                + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.BASIC_ISO_DATE)
                + String.format("%08d", master.getCartId());
        cartMapper.updateCartReserveNo(master.getCartId(), reserveNo);

        List<CartTicketResponse> tickets = new ArrayList<>();
        int seq = 1;
        for (CartMapper.HoldSeatPriceRow row : holdSeats) {
            String ticketNo = reserveNo + "-" + String.format("%02d", seq++);
            CartTicketInsertCommand ticket = new CartTicketInsertCommand();
            ticket.setTicketNo(ticketNo);
            ticket.setCartId(master.getCartId());
            ticket.setSeatId(row.seatId());
            ticket.setSeatGrade(row.seatGrade());
            ticket.setFloor(row.floor());
            ticket.setRowNo(row.rowNo());
            ticket.setSeatNo(row.seatNo());
            ticket.setPrice(row.price());
            cartMapper.insertCartTicket(ticket);

            tickets.add(new CartTicketResponse(
                    ticket.getCartTicketId(),
                    ticketNo,
                    row.seatId(),
                    row.seatGrade(),
                    row.floor(),
                    row.rowNo(),
                    row.seatNo(),
                    row.price()
            ));
        }

        return new CartResponse(
                master.getCartId(),
                reserveNo,
                request.sessionId(),
                memberId,
                request.goodsId(),
                goodsNm,
                request.salesId(),
                String.valueOf(sales.get("playDt")),
                String.valueOf(sales.get("playTm")),
                holdSeats.size(),
                totalAmt,
                "ACTIVE",
                expireAt,
                tickets
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
