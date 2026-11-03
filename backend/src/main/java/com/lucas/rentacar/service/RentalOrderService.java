package com.lucas.rentacar.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.lucas.rentacar.dto.order.OrderEvaluationRequest;
import com.lucas.rentacar.dto.order.RentalOrderRequest;
import com.lucas.rentacar.dto.order.RentalOrderResponse;
import com.lucas.rentacar.dto.order.RentalOrderResponse.PartyResponse;
import com.lucas.rentacar.enums.OrderStatus;
import com.lucas.rentacar.model.Agent;
import com.lucas.rentacar.model.Car;
import com.lucas.rentacar.model.Customer;
import com.lucas.rentacar.model.RentalOrder;
import com.lucas.rentacar.repository.AgentRepository;
import com.lucas.rentacar.repository.CustomerRepository;
import com.lucas.rentacar.repository.RentalOrderRepository;

/**
 * Rental orders. Customers create, read, change and cancel their own orders;
 * agents read and change any order, evaluate it (financial opinion) and, when
 * approved, move it to contract execution. Orders can only be changed or
 * cancelled while SUBMITTED.
 *
 * Callers pass the logged-in user's email and whether they are an agent.
 * Customers get 404 for orders that are not theirs.
 */
@Service
public class RentalOrderService {

    private static final long NEW_ORDER_ID = -1L;

    private final RentalOrderRepository rentalOrderRepository;
    private final CustomerRepository customerRepository;
    private final AgentRepository agentRepository;
    private final CarService carService;

    public RentalOrderService(
            RentalOrderRepository rentalOrderRepository,
            CustomerRepository customerRepository,
            AgentRepository agentRepository,
            CarService carService) {
        this.rentalOrderRepository = rentalOrderRepository;
        this.customerRepository = customerRepository;
        this.agentRepository = agentRepository;
        this.carService = carService;
    }

    @Transactional
    public RentalOrderResponse create(String email, RentalOrderRequest request) {
        RentalOrder order = new RentalOrder();

        order.setCustomer(findCustomer(email));
        order.setStatus(OrderStatus.SUBMITTED);
        applyBooking(order, request, NEW_ORDER_ID);

        return toResponse(rentalOrderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public Page<RentalOrderResponse> findAll(
            String email,
            boolean agent,
            OrderStatus status,
            Pageable pageable) {

        Page<RentalOrder> orders;

        if (agent) {
            orders = status == null
                    ? rentalOrderRepository.findAll(pageable)
                    : rentalOrderRepository.findAllByStatus(status, pageable);
        } else {
            Long customerId = findCustomer(email).getId();

            orders = status == null
                    ? rentalOrderRepository.findAllByCustomerId(customerId, pageable)
                    : rentalOrderRepository.findAllByCustomerIdAndStatus(customerId, status, pageable);
        }

        return orders.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public RentalOrderResponse findById(String email, boolean agent, Long id) {
        return toResponse(findVisible(email, agent, id));
    }

    @Transactional
    public RentalOrderResponse update(
            String email,
            boolean agent,
            Long id,
            RentalOrderRequest request) {

        RentalOrder order = findVisible(email, agent, id);

        requireStatus(order, OrderStatus.SUBMITTED, "Only submitted orders can be changed.");
        applyBooking(order, request, order.getId());

        return toResponse(order);
    }

    @Transactional
    public RentalOrderResponse cancel(String email, Long id) {
        RentalOrder order = findVisible(email, false, id);

        requireStatus(order, OrderStatus.SUBMITTED, "Only submitted orders can be cancelled.");
        order.setStatus(OrderStatus.CANCELLED);

        return toResponse(order);
    }

    @Transactional
    public RentalOrderResponse evaluate(
            String email,
            Long id,
            OrderEvaluationRequest request) {

        RentalOrder order = findVisible(email, true, id);

        requireStatus(order, OrderStatus.SUBMITTED, "Only submitted orders can be evaluated.");

        order.setStatus(request.approved() ? OrderStatus.APPROVED : OrderStatus.REJECTED);
        order.setAgentOpinion(request.opinion().trim());
        order.setEvaluatedBy(findAgent(email));
        order.setEvaluatedAt(Instant.now());

        return toResponse(order);
    }

    @Transactional
    public RentalOrderResponse contract(String email, Long id) {
        RentalOrder order = findVisible(email, true, id);

        requireStatus(order, OrderStatus.APPROVED, "Only approved orders can be contracted.");
        order.setStatus(OrderStatus.CONTRACTED);

        return toResponse(order);
    }

    /** Sets car, dates and amounts after checking the dates and availability. */
    private void applyBooking(RentalOrder order, RentalOrderRequest request, Long orderId) {
        if (!request.endDate().isAfter(request.startDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "End date must be after start date.");
        }

        Car car = carService.findActive(request.carId());

        if (rentalOrderRepository.existsOverlapping(
                car.getId(),
                request.startDate(),
                request.endDate(),
                OrderStatus.ACTIVE,
                orderId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Car is not available for the selected dates.");
        }

        long days = ChronoUnit.DAYS.between(request.startDate(), request.endDate());

        order.setCar(car);
        order.setStartDate(request.startDate());
        order.setEndDate(request.endDate());
        order.setDailyRate(car.getDailyRate());
        order.setTotalAmount(car.getDailyRate().multiply(BigDecimal.valueOf(days)));
    }

    private RentalOrder findVisible(String email, boolean agent, Long id) {
        RentalOrder order = rentalOrderRepository.findById(id)
                .orElseThrow(this::orderNotFound);

        if (!agent && !order.getCustomer().getId().equals(findCustomer(email).getId())) {
            throw orderNotFound();
        }

        return order;
    }

    private void requireStatus(RentalOrder order, OrderStatus expected, String reason) {
        if (order.getStatus() != expected) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, reason);
        }
    }

    private Customer findCustomer(String email) {
        return customerRepository
                .findByUserEmailAndUserDeletedAtIsNull(UserService.normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer not found."));
    }

    private Agent findAgent(String email) {
        return agentRepository.findByUserEmail(UserService.normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Agent not found."));
    }

    private ResponseStatusException orderNotFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found.");
    }

    private RentalOrderResponse toResponse(RentalOrder order) {
        Agent evaluatedBy = order.getEvaluatedBy();

        return new RentalOrderResponse(
                order.getId(),
                order.getStatus(),
                order.getStartDate(),
                order.getEndDate(),
                ChronoUnit.DAYS.between(order.getStartDate(), order.getEndDate()),
                order.getDailyRate(),
                order.getTotalAmount(),
                CarService.toResponse(order.getCar()),
                new PartyResponse(order.getCustomer().getId(), order.getCustomer().getName()),
                order.getAgentOpinion(),
                evaluatedBy == null
                        ? null
                        : new PartyResponse(evaluatedBy.getId(), evaluatedBy.getName()),
                order.getEvaluatedAt(),
                order.getCreatedAt(),
                order.getUpdatedAt());
    }
}
