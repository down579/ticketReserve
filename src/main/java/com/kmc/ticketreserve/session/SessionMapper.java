package com.kmc.ticketreserve.session;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.Map;

@Mapper
public interface SessionMapper {

    Map<String, Object> findActiveMember(@Param("memberId") Long memberId);

    Map<String, Object> findGoods(@Param("goodsId") Long goodsId);

    Map<String, Object> findOpenSales(
            @Param("salesId") Long salesId,
            @Param("goodsId") Long goodsId
    );

    int insertSession(
            @Param("sessionId") String sessionId,
            @Param("memberId") Long memberId,
            @Param("goodsId") Long goodsId,
            @Param("salesId") Long salesId,
            @Param("status") String status,
            @Param("expireAt") LocalDateTime expireAt
    );
}
