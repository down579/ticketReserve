package com.kmc.ticketreserve.hold;

import com.kmc.ticketreserve.hold.dto.HoldSeatsRequest;
import com.kmc.ticketreserve.hold.dto.HoldSeatsResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seats")
public class HoldController {

    private final HoldService holdService;

    public HoldController(HoldService holdService) {
        this.holdService = holdService;
    }

    @PostMapping("/hold")
    public HoldSeatsResponse holdSeats(@RequestBody HoldSeatsRequest request) {
        return holdService.holdSeats(request);
    }
}
