package com.kmc.ticketreserve.hold;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Map;

@Mapper
public interface HoldMapper {

    Map<String, Object> findActiveSession(@Param("sessionId") String sessionId);

    SeatLockRow findSeatForLock(
            @Param("seatId") Long seatId,
            @Param("salesId") Long salesId,
            @Param("forUpdate") boolean forUpdate
    );

    int updateSeatToHold(
            @Param("seatId") Long seatId,
            @Param("version") Integer version
    );

    int decreaseRemainIncreaseHold(@Param("seatassignId") Long seatassignId);

    int insertHold(HoldInsertCommand command);

    record SeatLockRow(
            Long seatId,
            Long seatassignId,
            Long salesId,
            String seatGrade,
            String floor,
            String rowNo,
            String seatNo,
            String seatStatus,
            Integer version
    ) {
    }
}
