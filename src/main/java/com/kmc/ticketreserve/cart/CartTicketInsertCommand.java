package com.kmc.ticketreserve.cart;

public class CartTicketInsertCommand {

    private Long cartTicketId;
    private String ticketNo;
    private Long cartId;
    private Long seatId;
    private String seatGrade;
    private String floor;
    private String rowNo;
    private String seatNo;
    private Integer price;

    public Long getCartTicketId() {
        return cartTicketId;
    }

    public void setCartTicketId(Long cartTicketId) {
        this.cartTicketId = cartTicketId;
    }

    public String getTicketNo() {
        return ticketNo;
    }

    public void setTicketNo(String ticketNo) {
        this.ticketNo = ticketNo;
    }

    public Long getCartId() {
        return cartId;
    }

    public void setCartId(Long cartId) {
        this.cartId = cartId;
    }

    public Long getSeatId() {
        return seatId;
    }

    public void setSeatId(Long seatId) {
        this.seatId = seatId;
    }

    public String getSeatGrade() {
        return seatGrade;
    }

    public void setSeatGrade(String seatGrade) {
        this.seatGrade = seatGrade;
    }

    public String getFloor() {
        return floor;
    }

    public void setFloor(String floor) {
        this.floor = floor;
    }

    public String getRowNo() {
        return rowNo;
    }

    public void setRowNo(String rowNo) {
        this.rowNo = rowNo;
    }

    public String getSeatNo() {
        return seatNo;
    }

    public void setSeatNo(String seatNo) {
        this.seatNo = seatNo;
    }

    public Integer getPrice() {
        return price;
    }

    public void setPrice(Integer price) {
        this.price = price;
    }
}
