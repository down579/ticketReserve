-- ============================================================
-- ticketReserve 샘플 데이터
-- 회원 / 상품 / 회차 / 가격 / 좌석재고 / 좌석상세
-- ============================================================

USE ticket_reserve;

-- 재실행 시 자식 → 부모 순으로 정리 (트랜잭션 데이터 포함)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE tb_booking_ticket;
TRUNCATE TABLE tb_booking_master;
TRUNCATE TABLE tb_cart_ticket;
TRUNCATE TABLE tb_cart_master;
TRUNCATE TABLE tb_seat_hold;
TRUNCATE TABLE tb_session;
TRUNCATE TABLE tb_goods_seatassign_details;
TRUNCATE TABLE tb_goods_seatassign;
TRUNCATE TABLE tb_goods_salesprice;
TRUNCATE TABLE tb_goods_sales;
TRUNCATE TABLE tb_goods_master;
TRUNCATE TABLE tb_member;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. 회원
-- ------------------------------------------------------------
INSERT INTO tb_member (member_id, login_id, password, member_nm, email, phone, status) VALUES
(1, 'user01', '{noop}password1', '홍길동', 'hong@example.com', '01012345678', 'ACTIVE'),
(2, 'user02', '{noop}password2', '김영희', 'kim@example.com', '01087654321', 'ACTIVE');

-- ------------------------------------------------------------
-- 2. 상품
-- ------------------------------------------------------------
INSERT INTO tb_goods_master (
    goods_id, goods_nm, place_nm, goods_desc, poster_url,
    sale_start_at, sale_end_at, status
) VALUES
(1, '뮤지컬 레미제라블', '블루스퀘어 신한카드홀',
 '레미제라블 내한 공연 샘플 상품입니다.',
 'https://example.com/poster/lesmis.jpg',
 '2026-07-01 00:00:00', '2026-12-31 23:59:59', 'ON_SALE');

-- ------------------------------------------------------------
-- 3. 회차 (2회)
-- ------------------------------------------------------------
INSERT INTO tb_goods_sales (sales_id, goods_id, play_dt, play_tm, play_seq, status) VALUES
(1, 1, '2026-08-15', '14:00', 1, 'OPEN'),
(2, 1, '2026-08-15', '19:00', 2, 'OPEN');

-- ------------------------------------------------------------
-- 4. 가격 (회차별 VIP/R/S)
-- ------------------------------------------------------------
INSERT INTO tb_goods_salesprice (sales_id, seat_grade, seat_grade_nm, price) VALUES
(1, 'VIP', 'VIP석', 170000),
(1, 'R',   'R석',   140000),
(1, 'S',   'S석',   110000),
(2, 'VIP', 'VIP석', 170000),
(2, 'R',   'R석',   140000),
(2, 'S',   'S석',   110000);

-- ------------------------------------------------------------
-- 5. 등급별 재고 집계
--    회차1: VIP 4 / R 8 / S 8 = 20석
--    회차2: VIP 4 / R 8 / S 8 = 20석
-- ------------------------------------------------------------
INSERT INTO tb_goods_seatassign (
    seatassign_id, sales_id, seat_grade, total_cnt, remain_cnt, hold_cnt, sold_cnt
) VALUES
(1, 1, 'VIP', 4, 4, 0, 0),
(2, 1, 'R',   8, 8, 0, 0),
(3, 1, 'S',   8, 8, 0, 0),
(4, 2, 'VIP', 4, 4, 0, 0),
(5, 2, 'R',   8, 8, 0, 0),
(6, 2, 'S',   8, 8, 0, 0);

-- ------------------------------------------------------------
-- 6. 좌석 상세 (회차1)
--    VIP: 블럭 A, 1열 1~4번
--    R  : 블럭 B, 2열 1~4번 / 3열 1~4번
--    S  : 블럭 C, 4열 1~4번 / 5열 1~4번
-- ------------------------------------------------------------
INSERT INTO tb_goods_seatassign_details (
    seatassign_id, sales_id, seat_grade, block_cd, floor, row_no, seat_no, seat_status, version
) VALUES
(1, 1, 'VIP', 'A', '1', '1', '1', 'AVAILABLE', 0),
(1, 1, 'VIP', 'A', '1', '1', '2', 'AVAILABLE', 0),
(1, 1, 'VIP', 'A', '1', '1', '3', 'AVAILABLE', 0),
(1, 1, 'VIP', 'A', '1', '1', '4', 'AVAILABLE', 0),
(2, 1, 'R', 'B', '1', '2', '1', 'AVAILABLE', 0),
(2, 1, 'R', 'B', '1', '2', '2', 'AVAILABLE', 0),
(2, 1, 'R', 'B', '1', '2', '3', 'AVAILABLE', 0),
(2, 1, 'R', 'B', '1', '2', '4', 'AVAILABLE', 0),
(2, 1, 'R', 'B', '1', '3', '1', 'AVAILABLE', 0),
(2, 1, 'R', 'B', '1', '3', '2', 'AVAILABLE', 0),
(2, 1, 'R', 'B', '1', '3', '3', 'AVAILABLE', 0),
(2, 1, 'R', 'B', '1', '3', '4', 'AVAILABLE', 0),
(3, 1, 'S', 'C', '1', '4', '1', 'AVAILABLE', 0),
(3, 1, 'S', 'C', '1', '4', '2', 'AVAILABLE', 0),
(3, 1, 'S', 'C', '1', '4', '3', 'AVAILABLE', 0),
(3, 1, 'S', 'C', '1', '4', '4', 'AVAILABLE', 0),
(3, 1, 'S', 'C', '1', '5', '1', 'AVAILABLE', 0),
(3, 1, 'S', 'C', '1', '5', '2', 'AVAILABLE', 0),
(3, 1, 'S', 'C', '1', '5', '3', 'AVAILABLE', 0),
(3, 1, 'S', 'C', '1', '5', '4', 'AVAILABLE', 0);

-- ------------------------------------------------------------
-- 7. 좌석 상세 (회차2) — 동일 배치
-- ------------------------------------------------------------
INSERT INTO tb_goods_seatassign_details (
    seatassign_id, sales_id, seat_grade, block_cd, floor, row_no, seat_no, seat_status, version
) VALUES
(4, 2, 'VIP', 'A', '1', '1', '1', 'AVAILABLE', 0),
(4, 2, 'VIP', 'A', '1', '1', '2', 'AVAILABLE', 0),
(4, 2, 'VIP', 'A', '1', '1', '3', 'AVAILABLE', 0),
(4, 2, 'VIP', 'A', '1', '1', '4', 'AVAILABLE', 0),
(5, 2, 'R', 'B', '1', '2', '1', 'AVAILABLE', 0),
(5, 2, 'R', 'B', '1', '2', '2', 'AVAILABLE', 0),
(5, 2, 'R', 'B', '1', '2', '3', 'AVAILABLE', 0),
(5, 2, 'R', 'B', '1', '2', '4', 'AVAILABLE', 0),
(5, 2, 'R', 'B', '1', '3', '1', 'AVAILABLE', 0),
(5, 2, 'R', 'B', '1', '3', '2', 'AVAILABLE', 0),
(5, 2, 'R', 'B', '1', '3', '3', 'AVAILABLE', 0),
(5, 2, 'R', 'B', '1', '3', '4', 'AVAILABLE', 0),
(6, 2, 'S', 'C', '1', '4', '1', 'AVAILABLE', 0),
(6, 2, 'S', 'C', '1', '4', '2', 'AVAILABLE', 0),
(6, 2, 'S', 'C', '1', '4', '3', 'AVAILABLE', 0),
(6, 2, 'S', 'C', '1', '4', '4', 'AVAILABLE', 0),
(6, 2, 'S', 'C', '1', '5', '1', 'AVAILABLE', 0),
(6, 2, 'S', 'C', '1', '5', '2', 'AVAILABLE', 0),
(6, 2, 'S', 'C', '1', '5', '3', 'AVAILABLE', 0),
(6, 2, 'S', 'C', '1', '5', '4', 'AVAILABLE', 0);

-- AUTO_INCREMENT 정렬
ALTER TABLE tb_member AUTO_INCREMENT = 3;
ALTER TABLE tb_goods_master AUTO_INCREMENT = 2;
ALTER TABLE tb_goods_sales AUTO_INCREMENT = 3;
ALTER TABLE tb_goods_seatassign AUTO_INCREMENT = 7;
