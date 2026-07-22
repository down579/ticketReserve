package com.kmc.ticketreserve.goods;

import com.kmc.ticketreserve.goods.dto.SalesItemResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface GoodsSalesMapper {

    Map<String, Object> findGoods(@Param("goodsId") Long goodsId);

    List<SalesItemResponse> findSalesByGoodsId(
            @Param("goodsId") Long goodsId,
            @Param("status") String status
    );
}
