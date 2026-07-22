package com.kmc.ticketreserve.cart;

import com.kmc.ticketreserve.cart.dto.CartResponse;
import com.kmc.ticketreserve.cart.dto.CreateCartRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/carts")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping
    public CartResponse create(@RequestBody CreateCartRequest request) {
        return cartService.create(request);
    }
}
