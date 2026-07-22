-- 기존 DB에 tb_seat_hold 추가 + details 선점 컬럼 정리
-- (schema.sql을 처음부터 새로 적용한 경우 이 파일은 불필요)

USE ticket_reserve;

-- 1) details에서 선점 전용 컬럼 제거 (상태는 seat_status만 유지)
ALTER TABLE tb_goods_seatassign_details
    DROP INDEX idx_seat_hold_expire,
    DROP INDEX idx_seat_hold_session,
    DROP COLUMN hold_session_id,
    DROP COLUMN hold_expire_at;

-- 2) 좌석 선점 테이블 생성
CREATE TABLE IF NOT EXISTS tb_seat_hold (
    hold_id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '선점 PK',
    session_id      VARCHAR(64)  NOT NULL COMMENT '예매 세션 FK',
    member_id       BIGINT       NOT NULL COMMENT '회원 FK',
    sales_id        BIGINT       NOT NULL COMMENT '회차 FK',
    seat_id         BIGINT       NOT NULL COMMENT '좌석 FK',
    status          VARCHAR(20)  NOT NULL DEFAULT 'HOLD' COMMENT 'HOLD/RELEASED/EXPIRED/CONFIRMED',
    hold_expire_at  DATETIME     NOT NULL COMMENT '선점 만료일시',
    active_seat_id  BIGINT       GENERATED ALWAYS AS (
                        CASE WHEN status = 'HOLD' THEN seat_id ELSE NULL END
                    ) STORED COMMENT '활성 선점 좌석(유니크용)',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (hold_id),
    UNIQUE KEY uk_seat_hold_active_seat (active_seat_id),
    KEY idx_seat_hold_session (session_id),
    KEY idx_seat_hold_member (member_id),
    KEY idx_seat_hold_sales (sales_id),
    KEY idx_seat_hold_seat (seat_id),
    KEY idx_seat_hold_expire (status, hold_expire_at),
    CONSTRAINT fk_seat_hold_session
        FOREIGN KEY (session_id) REFERENCES tb_session (session_id),
    CONSTRAINT fk_seat_hold_member
        FOREIGN KEY (member_id) REFERENCES tb_member (member_id),
    CONSTRAINT fk_seat_hold_sales
        FOREIGN KEY (sales_id) REFERENCES tb_goods_sales (sales_id),
    CONSTRAINT fk_seat_hold_seat
        FOREIGN KEY (seat_id) REFERENCES tb_goods_seatassign_details (seat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='좌석 선점';
