package com.kmc.ticketreserve.booking;

import com.kmc.ticketreserve.booking.dto.BookingResponse;
import com.kmc.ticketreserve.booking.dto.BookingTicketResponse;
import com.kmc.ticketreserve.booking.dto.CancelAllBookingsResponse;
import com.kmc.ticketreserve.booking.dto.CancelBookingResponse;
import com.kmc.ticketreserve.booking.dto.CreateBookingRequest;
import com.kmc.ticketreserve.common.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class BookingService {

    private final BookingMapper bookingMapper;

    public BookingService(BookingMapper bookingMapper) {
        this.bookingMapper = bookingMapper;
    }

    @Transactional
    public BookingResponse create(CreateBookingRequest request) {
        if (request.cartId() == null) {
            throw ApiException.badRequest("cartId는 필수입니다.");
        }

        Map<String, Object> cart = bookingMapper.findActiveCartForUpdate(request.cartId());
        if (cart == null) {
            throw ApiException.badRequest("유효한 장바구니가 아닙니다. cartId=" + request.cartId());
        }

        String reserveNo = (String) cart.get("reserveNo");
        if (reserveNo == null || reserveNo.isBlank()) {
            throw ApiException.badRequest("장바구니 예매번호가 없습니다. cartId=" + request.cartId());
        }

        String sessionId = String.valueOf(cart.get("sessionId"));
        Long memberId = toLong(cart.get("memberId"));
        Long goodsId = toLong(cart.get("goodsId"));
        Long salesId = toLong(cart.get("salesId"));
        Integer ticketCnt = toInt(cart.get("ticketCnt"));
        Integer totalAmt = toInt(cart.get("totalAmt"));

        List<BookingMapper.CartTicketRow> cartTickets = bookingMapper.findCartTickets(request.cartId());
        if (cartTickets == null || cartTickets.isEmpty()) {
            throw ApiException.badRequest("장바구니에 티켓이 없습니다. cartId=" + request.cartId());
        }

        for (BookingMapper.CartTicketRow ticket : cartTickets) {
            Long holdId = bookingMapper.findValidHoldId(sessionId, ticket.seatId());
            if (holdId == null) {
                throw ApiException.conflict("유효한 선점 좌석이 아닙니다. seatId=" + ticket.seatId());
            }
        }

        LocalDateTime bookedAt = LocalDateTime.now();
        BookingMasterInsertCommand master = new BookingMasterInsertCommand();
        master.setBookingNo(reserveNo);
        master.setMemberId(memberId);
        master.setCartId(request.cartId());
        master.setGoodsId(goodsId);
        master.setSalesId(salesId);
        master.setTicketCnt(ticketCnt);
        master.setTotalAmt(totalAmt);
        master.setPayAmt(totalAmt);
        master.setPayStatus("PAID");
        master.setBookingStatus("CONFIRMED");
        master.setBookedAt(bookedAt);
        bookingMapper.insertBookingMaster(master);

        List<BookingTicketResponse> tickets = new ArrayList<>();
        for (BookingMapper.CartTicketRow cartTicket : cartTickets) {
            BookingMapper.SeatStockRow seat = bookingMapper.findSeatStockForUpdate(cartTicket.seatId());
            if (seat == null) {
                throw ApiException.notFound("좌석을 찾을 수 없습니다. seatId=" + cartTicket.seatId());
            }
            if (!"HOLD".equals(seat.seatStatus())) {
                throw ApiException.conflict("선점 상태가 아닌 좌석입니다. seatId=" + cartTicket.seatId());
            }

            BookingTicketInsertCommand ticket = new BookingTicketInsertCommand();
            ticket.setTicketNo(cartTicket.ticketNo());
            ticket.setBookingId(master.getBookingId());
            ticket.setSeatId(cartTicket.seatId());
            ticket.setSeatGrade(cartTicket.seatGrade());
            ticket.setFloor(cartTicket.floor());
            ticket.setRowNo(cartTicket.rowNo());
            ticket.setSeatNo(cartTicket.seatNo());
            ticket.setPrice(cartTicket.price());
            ticket.setTicketStatus("VALID");
            bookingMapper.insertBookingTicket(ticket);

            int seatUpdated = bookingMapper.updateSeatToSold(cartTicket.seatId());
            if (seatUpdated != 1) {
                throw ApiException.conflict("좌석 판매 처리에 실패했습니다. seatId=" + cartTicket.seatId());
            }

            int stockUpdated = bookingMapper.convertHoldToSold(seat.seatassignId());
            if (stockUpdated != 1) {
                throw ApiException.conflict("좌석 재고 처리에 실패했습니다. seatId=" + cartTicket.seatId());
            }

            bookingMapper.deleteSeatHold(sessionId, cartTicket.seatId());

            tickets.add(new BookingTicketResponse(
                    ticket.getBookingTicketId(),
                    cartTicket.ticketNo(),
                    cartTicket.seatId(),
                    cartTicket.seatGrade(),
                    cartTicket.floor(),
                    cartTicket.rowNo(),
                    cartTicket.seatNo(),
                    cartTicket.price(),
                    "VALID"
            ));
        }

        int cartUpdated = bookingMapper.convertCart(request.cartId());
        if (cartUpdated != 1) {
            throw ApiException.conflict("장바구니 상태 변경에 실패했습니다. cartId=" + request.cartId());
        }
        bookingMapper.completeSession(sessionId);

        return new BookingResponse(
                master.getBookingId(),
                reserveNo,
                request.cartId(),
                memberId,
                goodsId,
                salesId,
                ticketCnt,
                totalAmt,
                totalAmt,
                "PAID",
                "CONFIRMED",
                bookedAt,
                tickets
        );
    }

    @Transactional
    public CancelBookingResponse cancel(Long bookingId) {
        if (bookingId == null) {
            throw ApiException.badRequest("bookingId는 필수입니다.");
        }

        Map<String, Object> booking = bookingMapper.findConfirmedBookingForUpdate(bookingId);
        if (booking == null) {
            throw ApiException.notFound("예매를 찾을 수 없습니다. bookingId=" + bookingId);
        }

        String bookingStatus = String.valueOf(booking.get("bookingStatus"));
        String payStatus = String.valueOf(booking.get("payStatus"));

        if ("CANCELLED".equals(bookingStatus)) {
            throw ApiException.badRequest("이미 취소된 예매입니다. bookingId=" + bookingId);
        }
        if (!"CONFIRMED".equals(bookingStatus) || !"PAID".equals(payStatus)) {
            throw ApiException.badRequest(
                    "취소할 수 없는 예매 상태입니다. bookingStatus=" + bookingStatus + ", payStatus=" + payStatus
            );
        }

        List<BookingMapper.BookingTicketSeatRow> tickets = bookingMapper.findValidTickets(bookingId);
        if (tickets == null || tickets.isEmpty()) {
            throw ApiException.badRequest("취소할 유효 티켓이 없습니다. bookingId=" + bookingId);
        }

        for (BookingMapper.BookingTicketSeatRow ticket : tickets) {
            BookingMapper.SeatStockRow seat = bookingMapper.findSeatStockForUpdate(ticket.seatId());
            if (seat == null) {
                throw ApiException.notFound("좌석을 찾을 수 없습니다. seatId=" + ticket.seatId());
            }
            if (!"SOLD".equals(seat.seatStatus())) {
                throw ApiException.conflict("판매 상태가 아닌 좌석입니다. seatId=" + ticket.seatId());
            }

            int seatUpdated = bookingMapper.updateSeatToAvailable(ticket.seatId());
            if (seatUpdated != 1) {
                throw ApiException.conflict("좌석 복구에 실패했습니다. seatId=" + ticket.seatId());
            }

            int stockUpdated = bookingMapper.restoreSoldToRemain(seat.seatassignId());
            if (stockUpdated != 1) {
                throw ApiException.conflict("좌석 재고 복구에 실패했습니다. seatId=" + ticket.seatId());
            }
        }

        bookingMapper.cancelAllTickets(bookingId);

        int bookingUpdated = bookingMapper.cancelBooking(bookingId);
        if (bookingUpdated != 1) {
            throw ApiException.conflict("예매 취소 처리에 실패했습니다. bookingId=" + bookingId);
        }

        return new CancelBookingResponse(
                bookingId,
                String.valueOf(booking.get("bookingNo")),
                "CANCELLED",
                "REFUNDED",
                toInt(booking.get("ticketCnt")),
                LocalDateTime.now()
        );
    }

    @Transactional
    public CancelAllBookingsResponse cancelAll() {
        List<Long> bookingIds = bookingMapper.findConfirmedBookingIds();
        List<CancelBookingResponse> cancelled = new ArrayList<>();

        if (bookingIds != null) {
            for (Long bookingId : bookingIds) {
                cancelled.add(cancel(bookingId));
            }
        }

        return new CancelAllBookingsResponse(cancelled.size(), cancelled);
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

    private static Integer toInt(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Integer intValue) {
            return intValue;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.valueOf(value.toString());
    }
}
