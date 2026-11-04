package com.lucas.rentacar.repository;

import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lucas.rentacar.model.CreditContract;

public interface CreditContractRepository extends JpaRepository<CreditContract, Long> {

    /** Deletes the credit contracts of the given customers' orders (demo data reset). */
    @Modifying
    @Query("""
            delete from CreditContract c
            where c.order.id in (
                select o.id from RentalOrder o where o.customer.id in :customerIds)
            """)
    int deleteAllByCustomerIds(@Param("customerIds") Collection<Long> customerIds);
}
