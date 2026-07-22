-- ============================================================
-- ticketReserve MySQL DDL
-- charset: utf8mb4 / engine: InnoDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS ticket_reserve
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE ticket_reserve;

-- ------------------------------------------------------------
-- 1. 회원
-- ------------------------------------------------------------
CREATE TABLE tb_member (
    member_id       BIGINT       NOT NULL AUTO_INCREMENT COMMENT '회원 PK',
    login_id        VARCHAR(50)  NOT NULL COMMENT '로그인 ID',
    password        VARCHAR(255) NOT NULL COMMENT '비밀번호(해시)',
    member_nm       VARCHAR(50)  NOT NULL COMMENT '회원명',
    email           VARCHAR(100) NULL COMMENT '이메일',
    phone           VARCHAR(20)  NULL COMMENT '휴대폰',
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/INACTIVE/WITHDRAWN',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (member_id),
    UNIQUE KEY uk_member_login_id (login_id),
    KEY idx_member_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='회원';

-- ------------------------------------------------------------
-- 2. 상품 마스터
-- ------------------------------------------------------------
CREATE TABLE tb_goods_master (
    goods_id        BIGINT       NOT NULL AUTO_INCREMENT COMMENT '상품 PK',
    goods_nm        VARCHAR(200) NOT NULL COMMENT '상품명',
    place_nm        VARCHAR(200) NULL COMMENT '공연장',
    goods_desc      TEXT         NULL COMMENT '상품 설명',
    poster_url      VARCHAR(500) NULL COMMENT '포스터 URL',
    sale_start_at   DATETIME     NULL COMMENT '판매 시작일시',
    sale_end_at     DATETIME     NULL COMMENT '판매 종료일시',
    status          VARCHAR(20)  NOT NULL DEFAULT 'READY' COMMENT 'READY/ON_SALE/CLOSED',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (goods_id),
    KEY idx_goods_status (status),
    KEY idx_goods_sale_period (sale_start_at, sale_end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 마스터';

-- ------------------------------------------------------------
-- 3. 상품 회차
-- ------------------------------------------------------------
CREATE TABLE tb_goods_sales (
    sales_id        BIGINT       NOT NULL AUTO_INCREMENT COMMENT '회차 PK',
    goods_id        BIGINT       NOT NULL COMMENT '상품 FK',
    play_dt         DATE         NOT NULL COMMENT '공연일',
    play_tm         VARCHAR(10)  NOT NULL COMMENT '공연시각(HH:mm)',
    play_seq        INT          NOT NULL DEFAULT 1 COMMENT '회차 순번',
    status          VARCHAR(20)  NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN/CLOSED/SOLD_OUT',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (sales_id),
    UNIQUE KEY uk_goods_sales_play (goods_id, play_dt, play_tm),
    KEY idx_goods_sales_goods (goods_id),
    KEY idx_goods_sales_status (status),
    CONSTRAINT fk_goods_sales_goods
        FOREIGN KEY (goods_id) REFERENCES tb_goods_master (goods_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 회차';

-- ------------------------------------------------------------
-- 4. 회차/좌석등급별 가격
-- ------------------------------------------------------------
CREATE TABLE tb_goods_salesprice (
    price_id        BIGINT       NOT NULL AUTO_INCREMENT COMMENT '가격 PK',
    sales_id        BIGINT       NOT NULL COMMENT '회차 FK',
    seat_grade      VARCHAR(20)  NOT NULL COMMENT '좌석등급 코드(VIP/R/S/A)',
    seat_grade_nm   VARCHAR(50)  NOT NULL COMMENT '좌석등급명',
    price           INT          NOT NULL COMMENT '가격',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (price_id),
    UNIQUE KEY uk_salesprice_grade (sales_id, seat_grade),
    KEY idx_salesprice_sales (sales_id),
    CONSTRAINT fk_salesprice_sales
        FOREIGN KEY (sales_id) REFERENCES tb_goods_sales (sales_id),
    CONSTRAINT chk_salesprice_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='회차 좌석등급별 가격';

-- ------------------------------------------------------------
-- 5. 회차/좌석등급별 재고 집계
-- ------------------------------------------------------------
CREATE TABLE tb_goods_seatassign (
    seatassign_id   BIGINT       NOT NULL AUTO_INCREMENT COMMENT '좌석배정(등급재고) PK',
    sales_id        BIGINT       NOT NULL COMMENT '회차 FK',
    seat_grade      VARCHAR(20)  NOT NULL COMMENT '좌석등급 코드',
    total_cnt       INT          NOT NULL DEFAULT 0 COMMENT '총 좌석수',
    remain_cnt      INT          NOT NULL DEFAULT 0 COMMENT '잔여 좌석수',
    hold_cnt        INT          NOT NULL DEFAULT 0 COMMENT '선점 좌석수',
    sold_cnt        INT          NOT NULL DEFAULT 0 COMMENT '판매 좌석수',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (seatassign_id),
    UNIQUE KEY uk_seatassign_grade (sales_id, seat_grade),
    KEY idx_seatassign_sales (sales_id),
    CONSTRAINT fk_seatassign_sales
        FOREIGN KEY (sales_id) REFERENCES tb_goods_sales (sales_id),
    CONSTRAINT chk_seatassign_cnts CHECK (
        total_cnt >= 0
        AND remain_cnt >= 0
        AND hold_cnt >= 0
        AND sold_cnt >= 0
        AND total_cnt >= (remain_cnt + hold_cnt + sold_cnt)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='회차 좌석등급별 재고';

-- ------------------------------------------------------------
-- 6. 좌석 상세 (좌석맵/상태)
-- ------------------------------------------------------------
CREATE TABLE tb_goods_seatassign_details (
    seat_id           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '좌석 PK',
    seatassign_id     BIGINT       NOT NULL COMMENT '등급재고 FK',
    sales_id          BIGINT       NOT NULL COMMENT '회차 ID(조회 편의)',
    seat_grade        VARCHAR(20)  NOT NULL COMMENT '좌석등급 코드',
    block_cd          VARCHAR(20)  NULL COMMENT '블럭 코드',
    floor             VARCHAR(10)  NOT NULL DEFAULT '1' COMMENT '층',
    row_no            VARCHAR(10)  NOT NULL COMMENT '열',
    seat_no           VARCHAR(10)  NOT NULL COMMENT '번',
    seat_status       VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE' COMMENT 'AVAILABLE/HOLD/SOLD/BLOCKED',
    version           INT          NOT NULL DEFAULT 0 COMMENT '낙관적 락 버전',
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (seat_id),
    UNIQUE KEY uk_seat_position (sales_id, block_cd, floor, row_no, seat_no),
    KEY idx_seat_seatassign (seatassign_id),
    KEY idx_seat_sales_status (sales_id, seat_status),
    KEY idx_seat_sales_block (sales_id, block_cd),
    KEY idx_seat_sales_grade (sales_id, seat_grade),
    CONSTRAINT fk_seat_seatassign
        FOREIGN KEY (seatassign_id) REFERENCES tb_goods_seatassign (seatassign_id),
    CONSTRAINT fk_seat_sales
        FOREIGN KEY (sales_id) REFERENCES tb_goods_sales (sales_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='좌석 상세 및 상태';

-- ------------------------------------------------------------
-- 7. 예매 세션
-- ------------------------------------------------------------
CREATE TABLE tb_session (
    session_id      VARCHAR(64)  NOT NULL COMMENT '세션 PK(UUID 등)',
    member_id       BIGINT       NOT NULL COMMENT '회원 FK',
    goods_id        BIGINT       NULL COMMENT '진행 중 상품',
    sales_id        BIGINT       NULL COMMENT '진행 중 회차',
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/EXPIRED/COMPLETED',
    expire_at       DATETIME     NOT NULL COMMENT '세션 만료일시',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (session_id),
    KEY idx_session_member (member_id),
    KEY idx_session_status_expire (status, expire_at),
    KEY idx_session_sales (sales_id),
    CONSTRAINT fk_session_member
        FOREIGN KEY (member_id) REFERENCES tb_member (member_id),
    CONSTRAINT fk_session_goods
        FOREIGN KEY (goods_id) REFERENCES tb_goods_master (goods_id),
    CONSTRAINT fk_session_sales
        FOREIGN KEY (sales_id) REFERENCES tb_goods_sales (sales_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='예매 세션';

-- ------------------------------------------------------------
-- 8. 좌석 선점
-- ------------------------------------------------------------
CREATE TABLE tb_seat_hold (
    hold_id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '선점 PK',
    session_id      VARCHAR(64)  NOT NULL COMMENT '예매 세션 FK',
    member_id       BIGINT       NOT NULL COMMENT '회원 FK',
    sales_id        BIGINT       NOT NULL COMMENT '회차 FK',
    seat_id         BIGINT       NOT NULL COMMENT '좌석 FK',
    status          VARCHAR(20)  NOT NULL DEFAULT 'HOLD' COMMENT 'HOLD/RELEASED/EXPIRED/CONFIRMED',
    hold_expire_at  DATETIME     NOT NULL COMMENT '선점 만료일시',
    -- HOLD 상태일 때만 seat_id를 담아 동일 좌석 중복 선점 방지 (해제/만료 이력은 허용)
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

-- ------------------------------------------------------------
-- 9. 장바구니 마스터
-- ------------------------------------------------------------
CREATE TABLE tb_cart_master (
    cart_id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '장바구니 PK',
    reserve_no      VARCHAR(30)  NULL COMMENT '예매번호(카트~예매 공통, 생성 직후 세팅)',
    member_id       BIGINT       NOT NULL COMMENT '회원 FK',
    session_id      VARCHAR(64)  NOT NULL COMMENT '예매 세션 FK',
    goods_id        BIGINT       NOT NULL COMMENT '상품 ID',
    sales_id        BIGINT       NOT NULL COMMENT '회차 ID',
    ticket_cnt      INT          NOT NULL DEFAULT 0 COMMENT '티켓 매수',
    total_amt       INT          NOT NULL DEFAULT 0 COMMENT '합계 금액',
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/CHECKOUT/EXPIRED/CONVERTED',
    expire_at       DATETIME     NOT NULL COMMENT '장바구니 만료일시',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (cart_id),
    UNIQUE KEY uk_cart_reserve_no (reserve_no),
    KEY idx_cart_member (member_id),
    KEY idx_cart_session (session_id),
    KEY idx_cart_status_expire (status, expire_at),
    KEY idx_cart_sales (sales_id),
    CONSTRAINT fk_cart_member
        FOREIGN KEY (member_id) REFERENCES tb_member (member_id),
    CONSTRAINT fk_cart_session
        FOREIGN KEY (session_id) REFERENCES tb_session (session_id),
    CONSTRAINT fk_cart_goods
        FOREIGN KEY (goods_id) REFERENCES tb_goods_master (goods_id),
    CONSTRAINT fk_cart_sales
        FOREIGN KEY (sales_id) REFERENCES tb_goods_sales (sales_id),
    CONSTRAINT chk_cart_amt CHECK (ticket_cnt >= 0 AND total_amt >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='장바구니 마스터';

-- ------------------------------------------------------------
-- 10. 장바구니 티켓(좌석)
-- ------------------------------------------------------------
CREATE TABLE tb_cart_ticket (
    cart_ticket_id  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '장바구니 티켓 PK',
    ticket_no       VARCHAR(40)  NOT NULL COMMENT '티켓번호(예매 시 복사)',
    cart_id         BIGINT       NOT NULL COMMENT '장바구니 FK',
    seat_id         BIGINT       NOT NULL COMMENT '좌석 FK',
    seat_grade      VARCHAR(20)  NOT NULL COMMENT '좌석등급',
    floor           VARCHAR(10)  NOT NULL COMMENT '층',
    row_no          VARCHAR(10)  NOT NULL COMMENT '열',
    seat_no         VARCHAR(10)  NOT NULL COMMENT '번',
    price           INT          NOT NULL COMMENT '담을 당시 가격',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    PRIMARY KEY (cart_ticket_id),
    UNIQUE KEY uk_cart_ticket_no (ticket_no),
    UNIQUE KEY uk_cart_ticket_seat (cart_id, seat_id),
    KEY idx_cart_ticket_cart (cart_id),
    KEY idx_cart_ticket_seat (seat_id),
    CONSTRAINT fk_cart_ticket_cart
        FOREIGN KEY (cart_id) REFERENCES tb_cart_master (cart_id),
    CONSTRAINT fk_cart_ticket_seat
        FOREIGN KEY (seat_id) REFERENCES tb_goods_seatassign_details (seat_id),
    CONSTRAINT chk_cart_ticket_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='장바구니 티켓';

-- ------------------------------------------------------------
-- 11. 예매 마스터
-- ------------------------------------------------------------
CREATE TABLE tb_booking_master (
    booking_id      BIGINT       NOT NULL AUTO_INCREMENT COMMENT '예매 PK',
    booking_no      VARCHAR(30)  NOT NULL COMMENT '예매번호',
    member_id       BIGINT       NOT NULL COMMENT '회원 FK',
    cart_id         BIGINT       NULL COMMENT '원본 장바구니 ID',
    goods_id        BIGINT       NOT NULL COMMENT '상품 ID',
    sales_id        BIGINT       NOT NULL COMMENT '회차 ID',
    ticket_cnt      INT          NOT NULL COMMENT '티켓 매수',
    total_amt       INT          NOT NULL COMMENT '합계 금액',
    pay_amt         INT          NOT NULL DEFAULT 0 COMMENT '실결제 금액',
    pay_status      VARCHAR(20)  NOT NULL DEFAULT 'READY' COMMENT 'READY/PAID/CANCELLED/REFUNDED',
    booking_status  VARCHAR(20)  NOT NULL DEFAULT 'CONFIRMED' COMMENT 'CONFIRMED/CANCELLED',
    booked_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '예매일시',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (booking_id),
    UNIQUE KEY uk_booking_no (booking_no),
    KEY idx_booking_member (member_id),
    KEY idx_booking_sales (sales_id),
    KEY idx_booking_status (booking_status, pay_status),
    KEY idx_booking_cart (cart_id),
    CONSTRAINT fk_booking_member
        FOREIGN KEY (member_id) REFERENCES tb_member (member_id),
    CONSTRAINT fk_booking_cart
        FOREIGN KEY (cart_id) REFERENCES tb_cart_master (cart_id),
    CONSTRAINT fk_booking_goods
        FOREIGN KEY (goods_id) REFERENCES tb_goods_master (goods_id),
    CONSTRAINT fk_booking_sales
        FOREIGN KEY (sales_id) REFERENCES tb_goods_sales (sales_id),
    CONSTRAINT chk_booking_amt CHECK (ticket_cnt >= 0 AND total_amt >= 0 AND pay_amt >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='예매 마스터';

-- ------------------------------------------------------------
-- 12. 예매 티켓(상세)
-- ------------------------------------------------------------
CREATE TABLE tb_booking_ticket (
    booking_ticket_id BIGINT       NOT NULL AUTO_INCREMENT COMMENT '예매 티켓 PK',
    ticket_no         VARCHAR(40)  NOT NULL COMMENT '티켓번호(카트에서 복사)',
    booking_id        BIGINT       NOT NULL COMMENT '예매 FK',
    seat_id           BIGINT       NOT NULL COMMENT '좌석 ID',
    seat_grade        VARCHAR(20)  NOT NULL COMMENT '좌석등급',
    floor             VARCHAR(10)  NOT NULL COMMENT '층',
    row_no            VARCHAR(10)  NOT NULL COMMENT '열',
    seat_no           VARCHAR(10)  NOT NULL COMMENT '번',
    price             INT          NOT NULL COMMENT '예매 당시 가격',
    ticket_status     VARCHAR(20)  NOT NULL DEFAULT 'VALID' COMMENT 'VALID/CANCELLED',
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (booking_ticket_id),
    UNIQUE KEY uk_booking_ticket_no (ticket_no),
    UNIQUE KEY uk_booking_ticket_seat (booking_id, seat_id),
    KEY idx_booking_ticket_booking (booking_id),
    KEY idx_booking_ticket_seat (seat_id),
    KEY idx_booking_ticket_status (ticket_status),
    CONSTRAINT fk_booking_ticket_booking
        FOREIGN KEY (booking_id) REFERENCES tb_booking_master (booking_id),
    CONSTRAINT fk_booking_ticket_seat
        FOREIGN KEY (seat_id) REFERENCES tb_goods_seatassign_details (seat_id),
    CONSTRAINT chk_booking_ticket_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='예매 티켓 상세';
