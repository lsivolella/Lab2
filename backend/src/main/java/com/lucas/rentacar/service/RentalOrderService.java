package com.lucas.rentacar.service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.lucas.rentacar.dto.order.ContractRequest;
import com.lucas.rentacar.dto.order.CreditTermsRequest;
import com.lucas.rentacar.dto.order.OrderEvaluationRequest;
import com.lucas.rentacar.dto.order.RentalOrderRequest;
import com.lucas.rentacar.dto.order.RentalOrderResponse;
import com.lucas.rentacar.dto.order.RentalOrderResponse.ContractResponse;
import com.lucas.rentacar.dto.order.RentalOrderResponse.CreditContractResponse;
import com.lucas.rentacar.dto.order.RentalOrderResponse.PartyResponse;
import com.lucas.rentacar.enums.AgentType;
import com.lucas.rentacar.enums.ContractPhase;
import com.lucas.rentacar.enums.OrderStatus;
import com.lucas.rentacar.enums.OwnershipType;
import com.lucas.rentacar.model.Agent;
import com.lucas.rentacar.model.Car;
import com.lucas.rentacar.model.Contract;
import com.lucas.rentacar.model.CreditContract;
import com.lucas.rentacar.model.Customer;
import com.lucas.rentacar.model.RentalOrder;
import com.lucas.rentacar.repository.AgentRepository;
import com.lucas.rentacar.repository.ContractRepository;
import com.lucas.rentacar.repository.CreditContractRepository;
import com.lucas.rentacar.repository.CustomerRepository;
import com.lucas.rentacar.repository.RentalOrderRepository;

/**
 * Rental orders. Customers create, read, change and cancel their own orders;
 * agents read and change any order. Orders can only be changed or cancelled
 * while SUBMITTED.
 *
 * Evaluation (financial opinion): orders that requested credit are evaluated
 * by a bank, which sets the credit terms when approving; other orders are
 * evaluated by the company that owns the car. The contract of an approved
 * order is executed by the company that owns the car.
 *
 * Callers pass the logged-in user's email and whether they are an agent.
 * Customers get 404 for orders that are not theirs.
 */
@Service
public class RentalOrderService {

    private static final long NEW_ORDER_ID = -1L;
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    private final RentalOrderRepository rentalOrderRepository;
    private final CreditContractRepository creditContractRepository;
    private final ContractRepository contractRepository;
    private final CustomerRepository customerRepository;
    private final AgentRepository agentRepository;
    private final CarService carService;

    public RentalOrderService(
            RentalOrderRepository rentalOrderRepository,
            CreditContractRepository creditContractRepository,
            ContractRepository contractRepository,
            CustomerRepository customerRepository,
            AgentRepository agentRepository,
            CarService carService) {
        this.rentalOrderRepository = rentalOrderRepository;
        this.creditContractRepository = creditContractRepository;
        this.contractRepository = contractRepository;
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
        Agent agent = findAgent(email);

        requireStatus(order, OrderStatus.SUBMITTED, "Only submitted orders can be evaluated.");
        requireEvaluator(order, agent);

        boolean grantsCredit = order.isCreditRequested() && request.approved();

        if (grantsCredit && request.credit() == null) {
            throw badRequest("Credit terms are required to approve an order with credit.");
        }

        if (!grantsCredit && request.credit() != null) {
            throw badRequest("Credit terms are only accepted when a bank approves an order with credit.");
        }

        order.setStatus(request.approved() ? OrderStatus.APPROVED : OrderStatus.REJECTED);
        order.setAgentOpinion(request.opinion().trim());
        order.setEvaluatedBy(agent);
        order.setEvaluatedAt(Instant.now());

        if (grantsCredit) {
            order.setCreditContract(creditContractRepository.save(
                    createCreditContract(order, agent, request.credit())));
        }

        return toResponse(order);
    }

    @Transactional
    public RentalOrderResponse contract(String email, Long id, ContractRequest request) {
        RentalOrder order = findVisible(email, true, id);
        Agent agent = findAgent(email);

        requireStatus(order, OrderStatus.APPROVED, "Only approved orders can be contracted.");
        requireCarOwner(order, agent, "Only the company that owns the car executes the contract.");

        if (request.ownershipType() == OwnershipType.BANK && order.getCreditContract() == null) {
            throw badRequest("BANK ownership requires a credit contract.");
        }

        Contract contract = new Contract();

        contract.setOrder(order);
        contract.setExecutedBy(agent);
        contract.setOwnershipType(request.ownershipType());

        order.setContract(contractRepository.save(contract));
        order.setStatus(OrderStatus.CONTRACTED);

        return toResponse(order);
    }

    /** Sets car, dates and amounts after checking the dates and availability. */
    private void applyBooking(RentalOrder order, RentalOrderRequest request, Long orderId) {
        if (!request.endDate().isAfter(request.startDate())) {
            throw badRequest("End date must be after start date.");
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
        order.setCreditRequested(request.wantsCredit());
    }

    private CreditContract createCreditContract(
            RentalOrder order,
            Agent bank,
            CreditTermsRequest terms) {

        CreditContract credit = new CreditContract();

        credit.setOrder(order);
        credit.setBank(bank);
        credit.setAmount(order.getTotalAmount());
        credit.setMonthlyInterestRate(terms.monthlyInterestRate());
        credit.setInstallments(terms.installments());
        credit.setInstallmentAmount(installmentAmount(
                order.getTotalAmount(),
                terms.monthlyInterestRate(),
                terms.installments()));

        return credit;
    }

    /**
     * Fixed installment (Price table): amount * i / (1 - (1 + i)^-n), where i is
     * the monthly rate as a fraction. With 0% interest it is amount / n.
     */
    static BigDecimal installmentAmount(BigDecimal amount, BigDecimal monthlyRatePercent, int installments) {
        MathContext mc = MathContext.DECIMAL64;
        BigDecimal rate = monthlyRatePercent.divide(ONE_HUNDRED, mc);

        if (rate.signum() == 0) {
            return amount.divide(BigDecimal.valueOf(installments), 2, RoundingMode.HALF_EVEN);
        }

        BigDecimal discount = BigDecimal.ONE.subtract(
                BigDecimal.ONE.divide(BigDecimal.ONE.add(rate).pow(installments, mc), mc));

        return amount.multiply(rate, mc).divide(discount, mc).setScale(2, RoundingMode.HALF_EVEN);
    }

    /** Banks evaluate orders with credit; the car owner evaluates the others. */
    private void requireEvaluator(RentalOrder order, Agent agent) {
        if (order.isCreditRequested()) {
            if (agent.getType() != AgentType.BANK) {
                throw forbidden("Orders with credit are evaluated by a bank.");
            }
        } else {
            requireCarOwner(order, agent, "Only the company that owns the car evaluates this order.");
        }
    }

    private void requireCarOwner(RentalOrder order, Agent agent, String reason) {
        if (!order.getCar().getOwner().getId().equals(agent.getId())) {
            throw forbidden(reason);
        }
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

    private ResponseStatusException badRequest(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }

    private ResponseStatusException forbidden(String reason) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, reason);
    }

    private RentalOrderResponse toResponse(RentalOrder order) {
        return new RentalOrderResponse(
                order.getId(),
                order.getStatus(),
                order.getStatus() == OrderStatus.CONTRACTED
                        ? ContractPhase.of(order.getStartDate(), order.getEndDate(), LocalDate.now())
                        : null,
                order.getStartDate(),
                order.getEndDate(),
                ChronoUnit.DAYS.between(order.getStartDate(), order.getEndDate()),
                order.getDailyRate(),
                order.getTotalAmount(),
                order.isCreditRequested(),
                CarService.toResponse(order.getCar()),
                party(order.getCustomer()),
                order.getAgentOpinion(),
                party(order.getEvaluatedBy()),
                order.getEvaluatedAt(),
                toResponse(order.getCreditContract()),
                toResponse(order.getContract()),
                order.getCreatedAt(),
                order.getUpdatedAt());
    }

    private CreditContractResponse toResponse(CreditContract credit) {
        if (credit == null) {
            return null;
        }

        return new CreditContractResponse(
                credit.getId(),
                party(credit.getBank()),
                credit.getAmount(),
                credit.getMonthlyInterestRate(),
                credit.getInstallments(),
                credit.getInstallmentAmount(),
                credit.getCreatedAt());
    }

    private ContractResponse toResponse(Contract contract) {
        if (contract == null) {
            return null;
        }

        RentalOrder order = contract.getOrder();
        PartyResponse owner = switch (contract.getOwnershipType()) {
            case CUSTOMER -> party(order.getCustomer());
            case COMPANY -> party(order.getCar().getOwner());
            case BANK -> party(order.getCreditContract().getBank());
        };

        return new ContractResponse(
                contract.getId(),
                contract.getOwnershipType(),
                owner,
                party(contract.getExecutedBy()),
                contract.getSignedAt());
    }

    private PartyResponse party(Customer customer) {
        return new PartyResponse(customer.getId(), customer.getName());
    }

    private PartyResponse party(Agent agent) {
        return agent == null ? null : new PartyResponse(agent.getId(), agent.getName());
    }
}
