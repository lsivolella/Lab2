package com.lucas.rentacar.repository;

import java.time.LocalDate;
import java.util.Collection;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lucas.rentacar.enums.OrderStatus;
import com.lucas.rentacar.model.RentalOrder;

public interface RentalOrderRepository extends JpaRepository<RentalOrder, Long> {
    Page<RentalOrder> findAllByCustomerId(Long customerId, Pageable pageable);

    Page<RentalOrder> findAllByCustomerIdAndStatus(
            Long customerId,
            OrderStatus status,
            Pageable pageable);

    Page<RentalOrder> findAllByStatus(OrderStatus status, Pageable pageable);

    /**
     * True when the car has an order in one of the given statuses whose rental
     * has not ended yet (return date after today).
     */
    @Query("""
            select count(o) > 0 from RentalOrder o
            where o.car.id = :carId
              and o.status in :statuses
              and o.endDate > :today
            """)
    boolean existsInProgress(
            @Param("carId") Long carId,
            @Param("statuses") Collection<OrderStatus> statuses,
            @Param("today") LocalDate today);

    /**
     * True when another order in one of the given statuses books the car on
     * any day of [startDate, endDate). Pass excludeId = -1 for new orders.
     */
    @Query("""
            select count(o) > 0 from RentalOrder o
            where o.car.id = :carId
              and o.id <> :excludeId
              and o.status in :statuses
              and o.startDate < :endDate
              and o.endDate > :startDate
            """)
    boolean existsOverlapping(
            @Param("carId") Long carId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("statuses") Collection<OrderStatus> statuses,
            @Param("excludeId") Long excludeId);
}
