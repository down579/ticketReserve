package com.kmc.ticketreserve.booking;

import com.kmc.ticketreserve.booking.dto.BookingResponse;
import com.kmc.ticketreserve.booking.dto.CancelAllBookingsResponse;
import com.kmc.ticketreserve.booking.dto.CancelBookingResponse;
import com.kmc.ticketreserve.booking.dto.CreateBookingRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public BookingResponse create(@RequestBody CreateBookingRequest request) {
        return bookingService.create(request);
    }

    @PostMapping("/cancel-all")
    public CancelAllBookingsResponse cancelAll() {
        return bookingService.cancelAll();
    }

    @PostMapping("/{bookingId}/cancel")
    public CancelBookingResponse cancel(@PathVariable Long bookingId) {
        return bookingService.cancel(bookingId);
    }

    @GetMapping("/threads")
    public String threadsTest() throws InterruptedException {
        Thread.sleep(10);
        return "";
    }

}
