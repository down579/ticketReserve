package com.kmc.ticketreserve.price;

import com.kmc.ticketreserve.price.dto.PriceItemResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PriceMapper {

    Map<String, Object> findSales(@Param("salesId") Long salesId);

    List<PriceItemResponse> findPricesByGrade(
            @Param("salesId") Long salesId,
            @Param("seatGrade") String seatGrade
    );
}
