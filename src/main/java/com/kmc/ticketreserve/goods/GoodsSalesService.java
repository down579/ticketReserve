package com.kmc.ticketreserve.goods;

import com.kmc.ticketreserve.common.ApiException;
import com.kmc.ticketreserve.goods.dto.GoodsSalesListResponse;
import com.kmc.ticketreserve.goods.dto.SalesItemResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class GoodsSalesService {

    private final GoodsSalesMapper goodsSalesMapper;

    public GoodsSalesService(GoodsSalesMapper goodsSalesMapper) {
        this.goodsSalesMapper = goodsSalesMapper;
    }

    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public GoodsSalesListResponse getSales(Long goodsId, String status) {
        Map<String, Object> goods = goodsSalesMapper.findGoods(goodsId);
        if (goods == null) {
            throw ApiException.notFound("상품을 찾을 수 없습니다. goodsId=" + goodsId);
        }

        String filterStatus = (status == null || status.isBlank()) ? "OPEN" : status;
        List<SalesItemResponse> sales = goodsSalesMapper.findSalesByGoodsId(goodsId, filterStatus);

        return new GoodsSalesListResponse(
                goodsId,
                String.valueOf(goods.get("goodsNm")),
                sales
        );
    }
}
