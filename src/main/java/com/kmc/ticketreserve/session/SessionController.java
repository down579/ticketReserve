package com.kmc.ticketreserve.session;

import com.kmc.ticketreserve.session.dto.CreateSessionRequest;
import com.kmc.ticketreserve.session.dto.SessionResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    public SessionResponse create(@RequestBody CreateSessionRequest request) {
        return sessionService.create(request);
    }
}
