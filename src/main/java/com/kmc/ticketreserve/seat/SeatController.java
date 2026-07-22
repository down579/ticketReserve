package com.kmc.ticketreserve.seat;

import com.kmc.ticketreserve.seat.dto.SeatMapResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales")
public class SeatController {

    private final SeatService seatService;

    public SeatController(SeatService seatService) {
        this.seatService = seatService;
    }

    @GetMapping("/{salesId}/seats")
    public SeatMapResponse getSeats(
            @PathVariable Long salesId,
            @RequestParam(required = false) String seatGrade,
            @RequestParam(required = false) String blockCd
    ) {
        return seatService.getSeatMap(salesId, seatGrade, blockCd);
    }
}
