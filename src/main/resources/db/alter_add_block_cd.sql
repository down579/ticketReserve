-- 기존 DB에 block_cd 추가 및 좌석 UK/인덱스 변경
-- (schema.sql을 처음부터 새로 적용한 경우 이 파일은 불필요)

USE ticket_reserve;

ALTER TABLE tb_goods_seatassign_details
    ADD COLUMN block_cd VARCHAR(20) NULL COMMENT '블럭 코드' AFTER seat_grade,
    DROP INDEX uk_seat_position,
    ADD UNIQUE KEY uk_seat_position (sales_id, block_cd, floor, row_no, seat_no),
    ADD KEY idx_seat_sales_block (sales_id, block_cd),
    ADD KEY idx_seat_sales_grade (sales_id, seat_grade);
