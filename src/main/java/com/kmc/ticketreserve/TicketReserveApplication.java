package com.kmc.ticketreserve;

import org.apache.ibatis.annotations.Mapper;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(excludeName = {
        "org.springframework.boot.data.redis.autoconfigure.RedisAutoConfiguration",
        "org.springframework.boot.data.redis.autoconfigure.RedisRepositoriesAutoConfiguration",
        "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration",
        "org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration"
})
@MapperScan(basePackages = "com.kmc.ticketreserve", annotationClass = Mapper.class)
public class TicketReserveApplication {

    public static void main(String[] args) {
        SpringApplication.run(TicketReserveApplication.class, args);
    }

}
