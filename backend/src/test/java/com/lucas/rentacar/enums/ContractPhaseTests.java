package com.lucas.rentacar.enums;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

class ContractPhaseTests {

    private static final LocalDate START = LocalDate.of(2026, 11, 10);
    private static final LocalDate END = LocalDate.of(2026, 11, 13);

    @Test
    void upcomingBeforePickup() {
        assertThat(ContractPhase.of(START, END, START.minusDays(1)))
                .isEqualTo(ContractPhase.UPCOMING);
    }

    @Test
    void inProgressFromPickupUntilTheDayBeforeReturn() {
        assertThat(ContractPhase.of(START, END, START)).isEqualTo(ContractPhase.IN_PROGRESS);
        assertThat(ContractPhase.of(START, END, END.minusDays(1))).isEqualTo(ContractPhase.IN_PROGRESS);
    }

    @Test
    void finishedOnAndAfterReturn() {
        assertThat(ContractPhase.of(START, END, END)).isEqualTo(ContractPhase.FINISHED);
        assertThat(ContractPhase.of(START, END, END.plusDays(30))).isEqualTo(ContractPhase.FINISHED);
    }
}
