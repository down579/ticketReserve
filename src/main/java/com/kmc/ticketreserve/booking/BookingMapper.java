package com.kmc.ticketreserve.booking;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface BookingMapper {

    Map<String, Object> findActiveCartForUpdate(@Param("cartId") Long cartId);

    List<CartTicketRow> findCartTickets(@Param("cartId") Long cartId);

    Long findValidHoldId(
            @Param("sessionId") String sessionId,
            @Param("seatId") Long seatId
    );

    SeatStockRow findSeatStockForUpdate(@Param("seatId") Long seatId);

    int insertBookingMaster(BookingMasterInsertCommand command);

    int insertBookingTicket(BookingTicketInsertCommand command);

    int updateSeatToSold(@Param("seatId") Long seatId);

    int convertHoldToSold(@Param("seatassignId") Long seatassignId);

    int deleteSeatHold(
            @Param("sessionId") String sessionId,
            @Param("seatId") Long seatId
    );

    int convertCart(@Param("cartId") Long cartId);

    int completeSession(@Param("sessionId") String sessionId);

    Map<String, Object> findConfirmedBookingForUpdate(@Param("bookingId") Long bookingId);

    List<Long> findConfirmedBookingIds();

    List<BookingTicketSeatRow> findValidTickets(@Param("bookingId") Long bookingId);

    int updateSeatToAvailable(@Param("seatId") Long seatId);

    int restoreSoldToRemain(@Param("seatassignId") Long seatassignId);

    int cancelAllTickets(@Param("bookingId") Long bookingId);

    int cancelBooking(@Param("bookingId") Long bookingId);

    record CartTicketRow(
            Long cartTicketId,
            String ticketNo,
            Long seatId,
            String seatGrade,
            String floor,
            String rowNo,
            String seatNo,
            Integer price
    ) {
    }

    record SeatStockRow(
            Long seatId,
            Long seatassignId,
            String seatStatus
    ) {
    }

    record BookingTicketSeatRow(
            Long bookingTicketId,
            Long seatId
    ) {
    }
}
