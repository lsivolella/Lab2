package com.lucas.rentacar.config;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.lucas.rentacar.enums.AgentType;
import com.lucas.rentacar.enums.OrderStatus;
import com.lucas.rentacar.enums.OwnershipType;
import com.lucas.rentacar.enums.Role;
import com.lucas.rentacar.model.Address;
import com.lucas.rentacar.model.Agent;
import com.lucas.rentacar.model.Car;
import com.lucas.rentacar.model.Contract;
import com.lucas.rentacar.model.CreditContract;
import com.lucas.rentacar.model.Customer;
import com.lucas.rentacar.model.EmploymentIncome;
import com.lucas.rentacar.model.RentalOrder;
import com.lucas.rentacar.model.User;
import com.lucas.rentacar.repository.AgentRepository;
import com.lucas.rentacar.repository.CarRepository;
import com.lucas.rentacar.repository.ContractRepository;
import com.lucas.rentacar.repository.CreditContractRepository;
import com.lucas.rentacar.repository.CustomerRepository;
import com.lucas.rentacar.repository.RentalOrderRepository;
import com.lucas.rentacar.repository.UserRepository;
import com.lucas.rentacar.service.RentalOrderService;

/**
 * Demo data for testing and presentations, refreshed on every startup after
 * the agents and cars (see AgentSeeder and CarSeeder):
 * - two demo customers are created, or restored (undeleted, password reset);
 * - all their orders are deleted and recreated with dates relative to today,
 *   one order per situation (under analysis, approved, rejected, cancelled,
 *   contracted, in progress and finished).
 * Orders of other customers are never touched, and each demo order uses a car
 * of the seeded company that is free on its dates. Disable it with
 * app.seed.demo-data.enabled=false.
 */
@Component
@Order(3)
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final long NEW_ORDER_ID = -1L;
    private static final BigDecimal DEMO_INTEREST_RATE = new BigDecimal("1.99");
    private static final int DEMO_INSTALLMENTS = 6;

    record DemoCustomer(
            String email,
            String name,
            String cpf,
            String rg,
            String profession,
            String street,
            String number,
            String district,
            String city,
            String state,
            String zipCode,
            String employer,
            BigDecimal income) {
    }

    /**
     * One demo order. Days are relative to today; credit orders are evaluated
     * by the bank, the others by the company that owns the car.
     */
    record DemoOrder(
            int customer,
            int preferredCar,
            int startDay,
            int endDay,
            boolean credit,
            OrderStatus status,
            String opinion,
            OwnershipType ownership) {
    }

    private static final List<DemoCustomer> CUSTOMERS = List.of(
            new DemoCustomer(
                    "cliente@rentacar.com", "Ana Demonstração", "12345678909", "MG1234567",
                    "Analista de Sistemas", "Avenida Afonso Pena", "1500", "Centro",
                    "Belo Horizonte", "MG", "30130005", "Tech Minas Ltda", new BigDecimal("6500.00")),
            new DemoCustomer(
                    "cliente2@rentacar.com", "Bruno Demonstração", "98765432100", "SP7654321",
                    "Professor", "Avenida Paulista", "1000", "Bela Vista",
                    "São Paulo", "SP", "01310100", "Escola Paulista", new BigDecimal("4800.00")));

    private static final List<DemoOrder> ORDERS = List.of(
            new DemoOrder(0, 0, 5, 8, false, OrderStatus.SUBMITTED, null, null),
            new DemoOrder(0, 1, 10, 15, true, OrderStatus.SUBMITTED, null, null),
            new DemoOrder(0, 2, 3, 6, false, OrderStatus.APPROVED,
                    "Renda compatível com o valor do aluguel.", null),
            new DemoOrder(1, 3, 20, 25, true, OrderStatus.APPROVED,
                    "Crédito aprovado: renda e histórico compatíveis.", null),
            new DemoOrder(1, 4, 7, 9, false, OrderStatus.REJECTED,
                    "Renda informada insuficiente para o período solicitado.", null),
            new DemoOrder(1, 5, 12, 14, false, OrderStatus.CANCELLED, null, null),
            new DemoOrder(0, 6, 30, 33, false, OrderStatus.CONTRACTED,
                    "Renda compatível com o valor do aluguel.", OwnershipType.COMPANY),
            new DemoOrder(0, 7, -2, 3, true, OrderStatus.CONTRACTED,
                    "Crédito aprovado em 6 parcelas.", OwnershipType.BANK),
            new DemoOrder(1, 0, -15, -10, false, OrderStatus.CONTRACTED,
                    "Renda compatível com o valor do aluguel.", OwnershipType.CUSTOMER));

    private final boolean enabled;
    private final String password;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final AgentRepository agentRepository;
    private final CarRepository carRepository;
    private final RentalOrderRepository rentalOrderRepository;
    private final CreditContractRepository creditContractRepository;
    private final ContractRepository contractRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(
            @Value("${app.seed.demo-data.enabled:true}") boolean enabled,
            @Value("${app.seed.demo-data.password:senha1234}") String password,
            UserRepository userRepository,
            CustomerRepository customerRepository,
            AgentRepository agentRepository,
            CarRepository carRepository,
            RentalOrderRepository rentalOrderRepository,
            CreditContractRepository creditContractRepository,
            ContractRepository contractRepository,
            PasswordEncoder passwordEncoder) {
        this.enabled = enabled;
        this.password = password;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.agentRepository = agentRepository;
        this.carRepository = carRepository;
        this.rentalOrderRepository = rentalOrderRepository;
        this.creditContractRepository = creditContractRepository;
        this.contractRepository = contractRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }

        Optional<Agent> company = agentRepository.findFirstByTypeOrderByIdAsc(AgentType.COMPANY);
        Optional<Agent> bank = agentRepository.findFirstByTypeOrderByIdAsc(AgentType.BANK);

        if (company.isEmpty() || bank.isEmpty()) {
            log.warn("Skipping demo data: a company and a bank agent are required.");
            return;
        }

        List<Car> cars = carRepository.findAllByOwnerIdAndDeletedAtIsNullOrderByIdAsc(company.get().getId());

        if (cars.isEmpty()) {
            log.warn("Skipping demo data: the company has no cars.");
            return;
        }

        List<Customer> customers = new ArrayList<>();

        for (DemoCustomer demo : CUSTOMERS) {
            ensureCustomer(demo).ifPresent(customers::add);
        }

        if (customers.size() < CUSTOMERS.size()) {
            log.warn("Skipping demo orders: not all demo customers are available.");
            return;
        }

        List<Long> customerIds = customers.stream().map(Customer::getId).toList();

        creditContractRepository.deleteAllByCustomerIds(customerIds);
        contractRepository.deleteAllByCustomerIds(customerIds);
        rentalOrderRepository.deleteAllByCustomerIds(customerIds);

        LocalDate today = LocalDate.now();
        int created = 0;

        for (DemoOrder demo : ORDERS) {
            if (createOrder(demo, customers, cars, company.get(), bank.get(), today)) {
                created++;
            }
        }

        log.info("Demo data refreshed: {} orders for {} demo customers.", created, customers.size());
    }

    /** Creates the demo customer, or restores it (undeleted, demo password). */
    private Optional<Customer> ensureCustomer(DemoCustomer demo) {
        Optional<Customer> existing = customerRepository.findByUserEmail(demo.email());

        if (existing.isPresent()) {
            User user = existing.get().getUser();
            user.setDeletedAt(null);

            if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                user.setPasswordHash(passwordEncoder.encode(password));
            }

            return existing;
        }

        if (userRepository.existsByEmail(demo.email()) || customerRepository.existsByCpf(demo.cpf())) {
            log.warn("Skipping demo customer {}: email or CPF already in use.", demo.email());
            return Optional.empty();
        }

        User user = new User();
        user.setEmail(demo.email());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(Role.CUSTOMER);

        Address address = new Address();
        address.setStreet(demo.street());
        address.setNumber(demo.number());
        address.setDistrict(demo.district());
        address.setCity(demo.city());
        address.setState(demo.state());
        address.setZipCode(demo.zipCode());

        EmploymentIncome income = new EmploymentIncome();
        income.setEmployer(demo.employer());
        income.setAmount(demo.income());

        Customer customer = new Customer();
        customer.setUser(userRepository.save(user));
        customer.setName(demo.name());
        customer.setRg(demo.rg());
        customer.setCpf(demo.cpf());
        customer.setProfession(demo.profession());
        customer.setAddress(address);
        customer.setIncomes(new ArrayList<>(List.of(income)));

        return Optional.of(customerRepository.save(customer));
    }

    private boolean createOrder(
            DemoOrder demo,
            List<Customer> customers,
            List<Car> cars,
            Agent company,
            Agent bank,
            LocalDate today) {

        LocalDate start = today.plusDays(demo.startDay());
        LocalDate end = today.plusDays(demo.endDay());
        Optional<Car> car = freeCar(cars, demo.preferredCar(), start, end);

        if (car.isEmpty()) {
            log.warn("Skipping a demo order: no free car from {} to {}.", start, end);
            return false;
        }

        long days = ChronoUnit.DAYS.between(start, end);
        Agent evaluator = demo.credit() ? bank : company;
        Instant beforeStart = start.minusDays(3).atStartOfDay(ZoneId.systemDefault()).toInstant();

        RentalOrder order = new RentalOrder();
        order.setCustomer(customers.get(demo.customer()));
        order.setCar(car.get());
        order.setStartDate(start);
        order.setEndDate(end);
        order.setDailyRate(car.get().getDailyRate());
        order.setTotalAmount(car.get().getDailyRate().multiply(BigDecimal.valueOf(days)));
        order.setCreditRequested(demo.credit());
        order.setStatus(demo.status());

        if (demo.opinion() != null) {
            order.setAgentOpinion(demo.opinion());
            order.setEvaluatedBy(evaluator);
            order.setEvaluatedAt(earliest(beforeStart, Instant.now()));
        }

        rentalOrderRepository.save(order);

        boolean approvedCredit = demo.credit()
                && (demo.status() == OrderStatus.APPROVED || demo.status() == OrderStatus.CONTRACTED);

        if (approvedCredit) {
            CreditContract credit = new CreditContract();
            credit.setOrder(order);
            credit.setBank(bank);
            credit.setAmount(order.getTotalAmount());
            credit.setMonthlyInterestRate(DEMO_INTEREST_RATE);
            credit.setInstallments(DEMO_INSTALLMENTS);
            credit.setInstallmentAmount(RentalOrderService.installmentAmount(
                    order.getTotalAmount(), DEMO_INTEREST_RATE, DEMO_INSTALLMENTS));
            creditContractRepository.save(credit);
        }

        if (demo.status() == OrderStatus.CONTRACTED) {
            Contract contract = new Contract();
            contract.setOrder(order);
            contract.setExecutedBy(company);
            contract.setOwnershipType(demo.ownership());
            contract.setSignedAt(earliest(beforeStart.plus(1, ChronoUnit.DAYS), Instant.now()));
            contractRepository.save(contract);
        }

        return true;
    }

    /** The preferred car if it is free on the dates, otherwise the next free one. */
    private Optional<Car> freeCar(List<Car> cars, int preferred, LocalDate start, LocalDate end) {
        for (int i = 0; i < cars.size(); i++) {
            Car car = cars.get((preferred + i) % cars.size());

            if (!rentalOrderRepository.existsOverlapping(
                    car.getId(), start, end, OrderStatus.ACTIVE, NEW_ORDER_ID)) {
                return Optional.of(car);
            }
        }

        return Optional.empty();
    }

    private static Instant earliest(Instant a, Instant b) {
        return a.isBefore(b) ? a : b;
    }
}
