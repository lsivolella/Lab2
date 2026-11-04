package com.lucas.rentacar.enums;

import java.time.LocalDate;

/**
 * Where a CONTRACTED order stands in time. Not stored: it is calculated from
 * the rental dates whenever an order is read.
 */
public enum ContractPhase {
    /** Before the pickup date. */
    UPCOMING,
    /** From pickup until the day before the return date. */
    IN_PROGRESS,
    /** On or after the return date. */
    FINISHED;

    public static ContractPhase of(LocalDate startDate, LocalDate endDate, LocalDate today) {
        if (today.isBefore(startDate)) {
            return UPCOMING;
        }

        return today.isBefore(endDate) ? IN_PROGRESS : FINISHED;
    }
}
