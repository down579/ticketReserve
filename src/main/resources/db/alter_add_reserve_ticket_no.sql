-- 기존 DB에 reserve_no / ticket_no 추가
-- (schema.sql을 처음부터 새로 적용한 경우 이 파일은 불필요)

USE ticket_reserve;

ALTER TABLE tb_cart_master
    ADD COLUMN reserve_no VARCHAR(30) NULL COMMENT '예매번호(카트~예매 공통)' AFTER cart_id,
    ADD UNIQUE KEY uk_cart_reserve_no (reserve_no);

ALTER TABLE tb_cart_ticket
    ADD COLUMN ticket_no VARCHAR(40) NOT NULL COMMENT '티켓번호' AFTER cart_ticket_id,
    ADD UNIQUE KEY uk_cart_ticket_no (ticket_no);

ALTER TABLE tb_booking_ticket
    ADD COLUMN ticket_no VARCHAR(40) NOT NULL COMMENT '티켓번호(카트에서 복사)' AFTER booking_ticket_id,
    ADD UNIQUE KEY uk_booking_ticket_no (ticket_no);
