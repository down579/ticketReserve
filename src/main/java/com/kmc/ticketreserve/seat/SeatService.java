package com.kmc.ticketreserve.seat;

import com.kmc.ticketreserve.common.ApiException;
import com.kmc.ticketreserve.seat.dto.SeatBlockResponse;
import com.kmc.ticketreserve.seat.dto.SeatItemResponse;
import com.kmc.ticketreserve.seat.dto.SeatMapResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SeatService {

    private final SeatMapper seatMapper;

    public SeatService(SeatMapper seatMapper) {
        this.seatMapper = seatMapper;
    }

    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public SeatMapResponse getSeatMap(Long salesId, String seatGrade, String blockCd) {
        Map<String, Object> sales = seatMapper.findSales(salesId);
        if (sales == null) {
            throw ApiException.notFound("회차를 찾을 수 없습니다. salesId=" + salesId);
        }

        List<SeatMapper.SeatRow> rows = seatMapper.findSeats(salesId, blankToNull(seatGrade), blankToNull(blockCd));

        Map<String, List<SeatItemResponse>> grouped = new LinkedHashMap<>();
        boolean hasBlock = false;

        for (SeatMapper.SeatRow row : rows) {
            if (row.blockCd() != null && !row.blockCd().isBlank()) {
                hasBlock = true;
            }
            String key = row.blockCd();
            grouped.computeIfAbsent(key, k -> new ArrayList<>())
                    .add(new SeatItemResponse(
                            row.seatId(),
                            row.seatGrade(),
                            row.floor(),
                            row.rowNo(),
                            row.seatNo(),
                            row.seatStatus()
                    ));
        }

        List<SeatBlockResponse> blocks = grouped.entrySet().stream()
                .map(e -> new SeatBlockResponse(e.getKey(), e.getValue()))
                .toList();

        return new SeatMapResponse(salesId, hasBlock, blocks);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }
}
