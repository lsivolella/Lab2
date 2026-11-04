package com.lucas.rentacar.model;

import java.time.Instant;

import com.lucas.rentacar.enums.OwnershipType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * Rental contract, executed by the company that owns the car after the order
 * is approved. Records who the car is registered to during the contract:
 * the customer, the company (car owner) or the bank that granted the credit.
 */
@Entity
@Table(name = "contracts")
public class Contract {

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
    @JoinColumn(name = "executed_by_agent_id", nullable = false)
    private Agent executedBy;

    public Agent getExecutedBy() {
        return executedBy;
    }

    public void setExecutedBy(Agent executedBy) {
        this.executedBy = executedBy;
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OwnershipType ownershipType;

    public OwnershipType getOwnershipType() {
        return ownershipType;
    }

    public void setOwnershipType(OwnershipType ownershipType) {
        this.ownershipType = ownershipType;
    }

    @Column(nullable = false, updatable = false)
    private Instant signedAt;

    public Instant getSignedAt() {
        return signedAt;
    }

    /** Only for demo data with past dates; normally set on persist. */
    public void setSignedAt(Instant signedAt) {
        this.signedAt = signedAt;
    }

    @PrePersist
    private void onCreate() {
        if (signedAt == null) {
            signedAt = Instant.now();
        }
    }
}
