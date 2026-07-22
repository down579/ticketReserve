package com.kmc.ticketreserve.cart;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.Map;

@Mapper
public interface CartMapper {

    Map<String, Object> findActiveSession(@Param("sessionId") String sessionId);

    HoldSeatPriceRow findHoldSeatWithPrice(
            @Param("sessionId") String sessionId,
            @Param("salesId") Long salesId,
            @Param("seatId") Long seatId
    );

    String findGoodsNm(@Param("goodsId") Long goodsId);

    Map<String, Object> findSalesPlayInfo(@Param("salesId") Long salesId);

    int expireActiveCartsBySession(@Param("sessionId") String sessionId);

    int insertCartMaster(CartMasterInsertCommand command);

    int updateCartReserveNo(
            @Param("cartId") Long cartId,
            @Param("reserveNo") String reserveNo
    );

    int insertCartTicket(CartTicketInsertCommand command);

    record HoldSeatPriceRow(
            Long seatId,
            String seatGrade,
            String floor,
            String rowNo,
            String seatNo,
            Integer price,
            LocalDateTime holdExpireAt
    ) {
    }
}
