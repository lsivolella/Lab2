package com.lucas.rentacar.enums;

import java.util.Set;

/**
 * SUBMITTED -> APPROVED -> CONTRACTED
 * SUBMITTED -> REJECTED
 * SUBMITTED -> CANCELLED (by the customer)
 */
public enum OrderStatus {
    SUBMITTED,
    APPROVED,
    REJECTED,
    CONTRACTED,
    CANCELLED;

    /** Statuses that keep the car booked for the order dates. */
    public static final Set<OrderStatus> ACTIVE = Set.of(SUBMITTED, APPROVED, CONTRACTED);
}
