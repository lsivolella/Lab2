package com.lucas.rentacar.model;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * Credit granted by a bank agent to pay for a rental order. Created when the
 * bank approves an order that requested credit.
 */
@Entity
@Table(name = "credit_contracts")
public class CreditContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private RentalOrder order;

    public RentalOrder getOrder() {
        return order;
    }

    public void setOrder(RentalOrder order) {
        this.order = order;
    }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bank_agent_id", nullable = false)
    private Agent bank;

    public Agent getBank() {
        return bank;
    }

    public void setBank(Agent bank) {
        this.bank = bank;
    }

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    // Percent per month, e.g. 1.99 means 1.99% a month.
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal monthlyInterestRate;

    public BigDecimal getMonthlyInterestRate() {
        return monthlyInterestRate;
    }

    public void setMonthlyInterestRate(BigDecimal monthlyInterestRate) {
        this.monthlyInterestRate = monthlyInterestRate;
    }

    @Column(nullable = false)
    private Integer installments;

    public Integer getInstallments() {
        return installments;
    }

    public void setInstallments(Integer installments) {
        this.installments = installments;
    }

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal installmentAmount;

    public BigDecimal getInstallmentAmount() {
        return installmentAmount;
    }

    public void setInstallmentAmount(BigDecimal installmentAmount) {
        this.installmentAmount = installmentAmount;
    }

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public Instant getCreatedAt() {
        return createdAt;
    }

    @PrePersist
    private void onCreate() {
        createdAt = Instant.now();
    }
}
