package com.kmc.ticketreserve.seat;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SeatMapper {

    Map<String, Object> findSales(@Param("salesId") Long salesId);

    List<SeatRow> findSeats(
            @Param("salesId") Long salesId,
            @Param("seatGrade") String seatGrade,
            @Param("blockCd") String blockCd
    );

    record SeatRow(
            Long seatId,
            String seatGrade,
            String blockCd,
            String floor,
            String rowNo,
            String seatNo,
            String seatStatus
    ) {
    }
}
