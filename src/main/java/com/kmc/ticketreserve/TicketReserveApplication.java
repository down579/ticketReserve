package com.kmc.ticketreserve;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.kmc.ticketreserve")
public class TicketReserveApplication {

    public static void main(String[] args) {
        SpringApplication.run(TicketReserveApplication.class, args);
    }

}
