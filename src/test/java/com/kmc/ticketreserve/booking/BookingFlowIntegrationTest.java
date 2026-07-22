package com.kmc.ticketreserve.booking;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 예매 1건 E2E: 세션 생성 → 좌석 선점 → 카트 생성 → 예매 확정
 * (로컬 MySQL + seed.sql 데이터 필요: memberId=1, goodsId=1, salesId=1)
 */
@SpringBootTest
class BookingFlowIntegrationTest {

    private static final long MEMBER_ID = 1L;
    private static final long GOODS_ID = 1L;
    private static final long SALES_ID = 1L;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("예매 1건 전체 흐름 성공")
    void createOneBookingSuccessfully() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        // 1) AVAILABLE R석 2개 조회
        MvcResult seatsResult = mockMvc.perform(get("/api/sales/{salesId}/seats", SALES_ID)
                        .param("seatGrade", "R"))
                .andExpect(status().isOk())
                .andReturn();

        List<Long> seatIds = pickAvailableSeats(seatsResult, 2);
        assertThat(seatIds).hasSize(2);

        // 2) 예매 세션 생성
        MvcResult sessionResult = mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "memberId": %d,
                                  "goodsId": %d,
                                  "salesId": %d
                                }
                                """.formatted(MEMBER_ID, GOODS_ID, SALES_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").isNotEmpty())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andReturn();

        String sessionId = objectMapper.readTree(sessionResult.getResponse().getContentAsString())
                .get("sessionId")
                .asText();

        // 3) 좌석 선점
        mockMvc.perform(post("/api/seats/hold")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sessionId": "%s",
                                  "salesId": %d,
                                  "seatIds": [%d, %d]
                                }
                                """.formatted(sessionId, SALES_ID, seatIds.get(0), seatIds.get(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.holds.length()").value(2))
                .andExpect(jsonPath("$.holds[0].status").value("HOLD"));

        // 4) 카트 생성
        MvcResult cartResult = mockMvc.perform(post("/api/carts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sessionId": "%s",
                                  "goodsId": %d,
                                  "salesId": %d,
                                  "seatIds": [%d, %d]
                                }
                                """.formatted(sessionId, GOODS_ID, SALES_ID, seatIds.get(0), seatIds.get(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cartId").isNumber())
                .andExpect(jsonPath("$.reserveNo").isNotEmpty())
                .andExpect(jsonPath("$.ticketCnt").value(2))
                .andExpect(jsonPath("$.tickets.length()").value(2))
                .andExpect(jsonPath("$.tickets[0].ticketNo").isNotEmpty())
                .andReturn();

        JsonNode cart = objectMapper.readTree(cartResult.getResponse().getContentAsString());
        long cartId = cart.get("cartId").asLong();
        String reserveNo = cart.get("reserveNo").asText();
        String ticketNo1 = cart.get("tickets").get(0).get("ticketNo").asText();
        String ticketNo2 = cart.get("tickets").get(1).get("ticketNo").asText();
        int totalAmt = cart.get("totalAmt").asInt();

        // 5) 예매 확정 (번호는 카트에서 복사)
        MvcResult bookingResult = mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "cartId": %d }
                                """.formatted(cartId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingId").isNumber())
                .andExpect(jsonPath("$.bookingNo").value(reserveNo))
                .andExpect(jsonPath("$.cartId").value(cartId))
                .andExpect(jsonPath("$.ticketCnt").value(2))
                .andExpect(jsonPath("$.totalAmt").value(totalAmt))
                .andExpect(jsonPath("$.payAmt").value(totalAmt))
                .andExpect(jsonPath("$.payStatus").value("PAID"))
                .andExpect(jsonPath("$.bookingStatus").value("CONFIRMED"))
                .andExpect(jsonPath("$.tickets.length()").value(2))
                .andExpect(jsonPath("$.tickets[0].ticketNo").value(ticketNo1))
                .andExpect(jsonPath("$.tickets[1].ticketNo").value(ticketNo2))
                .andExpect(jsonPath("$.tickets[0].ticketStatus").value("VALID"))
                .andReturn();

        long bookingId = objectMapper.readTree(bookingResult.getResponse().getContentAsString())
                .get("bookingId")
                .asLong();

        // 6) 정리: 전체 취소 (재실행 가능하도록 좌석 복구)
        mockMvc.perform(post("/api/bookings/{bookingId}/cancel", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingStatus").value("CANCELLED"))
                .andExpect(jsonPath("$.payStatus").value("REFUNDED"));
    }

    private List<Long> pickAvailableSeats(MvcResult seatsResult, int count) throws Exception {
        JsonNode root = objectMapper.readTree(seatsResult.getResponse().getContentAsString());
        List<Long> seatIds = new ArrayList<>();
        for (JsonNode block : root.get("blocks")) {
            for (JsonNode seat : block.get("seats")) {
                if ("AVAILABLE".equals(seat.get("seatStatus").asText())) {
                    seatIds.add(seat.get("seatId").asLong());
                    if (seatIds.size() == count) {
                        return seatIds;
                    }
                }
            }
        }
        return seatIds;
    }
}
