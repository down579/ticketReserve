package com.kmc.ticketreserve.booking;

public class BookingTicketInsertCommand {

    private Long bookingTicketId;
    private String ticketNo;
    private Long bookingId;
    private Long seatId;
    private String seatGrade;
    private String floor;
    private String rowNo;
    private String seatNo;
    private Integer price;
    private String ticketStatus;

    public Long getBookingTicketId() {
        return bookingTicketId;
    }

    public void setBookingTicketId(Long bookingTicketId) {
        this.bookingTicketId = bookingTicketId;
    }

    public String getTicketNo() {
        return ticketNo;
    }

    public void setTicketNo(String ticketNo) {
        this.ticketNo = ticketNo;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
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

    public String getTicketStatus() {
        return ticketStatus;
    }

    public void setTicketStatus(String ticketStatus) {
        this.ticketStatus = ticketStatus;
    }
}
