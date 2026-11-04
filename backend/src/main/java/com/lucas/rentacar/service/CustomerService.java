package com.lucas.rentacar.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.lucas.rentacar.dto.auth.RegisterRequest;
import com.lucas.rentacar.dto.customer.AddressRequest;
import com.lucas.rentacar.dto.customer.CustomerResponse;
import com.lucas.rentacar.dto.customer.CustomerResponse.AddressResponse;
import com.lucas.rentacar.dto.customer.CustomerResponse.EmploymentIncomeResponse;
import com.lucas.rentacar.dto.customer.CustomerUpdateRequest;
import com.lucas.rentacar.dto.customer.EmploymentIncomeRequest;
import com.lucas.rentacar.dto.user.UserResponse;
import com.lucas.rentacar.enums.Role;
import com.lucas.rentacar.model.Address;
import com.lucas.rentacar.model.Customer;
import com.lucas.rentacar.model.EmploymentIncome;
import com.lucas.rentacar.model.User;
import com.lucas.rentacar.repository.CustomerRepository;
import com.lucas.rentacar.repository.UserRepository;

/**
 * Customer CRUD. Customers manage their own profile (looked up by the email of
 * the logged-in user); agents can list and read customers. Deleting is a soft
 * delete: User.deletedAt is set and the account can no longer log in.
 */
@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerService(
            CustomerRepository customerRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse create(RegisterRequest request) {
        String email = UserService.normalizeEmail(request.email());
        String cpf = request.cpf();

        ensureUniqueData(email, cpf);

        User savedUser = userRepository.save(createUser(request, email));
        Customer savedCustomer = customerRepository.save(
                createCustomer(request, savedUser, cpf));

        return new UserResponse(
                savedUser.getId(),
                savedCustomer.getName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                null);
    }

    @Transactional(readOnly = true)
    public CustomerResponse findByEmail(String email) {
        return toResponse(findActiveByEmail(email));
    }

    @Transactional(readOnly = true)
    public CustomerResponse findById(Long id) {
        Customer customer = customerRepository.findByIdAndUserDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer not found."));

        return toResponse(customer);
    }

    @Transactional(readOnly = true)
    public Page<CustomerResponse> findAll(Pageable pageable) {
        return customerRepository.findAllByUserDeletedAtIsNull(pageable)
                .map(this::toResponse);
    }

    @Transactional
    public CustomerResponse update(String email, CustomerUpdateRequest request) {
        Customer customer = findActiveByEmail(email);

        customer.setName(request.name().trim());
        customer.setRg(request.rg().trim());
        customer.setProfession(request.profession().trim());
        customer.setAddress(toAddress(request.address()));
        customer.getIncomes().clear();
        customer.getIncomes().addAll(toIncomes(request.incomes()));

        return toResponse(customer);
    }

    @Transactional
    public void delete(String email) {
        Customer customer = findActiveByEmail(email);

        customer.getUser().setDeletedAt(Instant.now());
    }

    private Customer findActiveByEmail(String email) {
        return customerRepository
                .findByUserEmailAndUserDeletedAtIsNull(UserService.normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer not found."));
    }

    private void ensureUniqueData(String email, String cpf) {
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email already registered.");
        }

        if (customerRepository.existsByCpf(cpf)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "CPF already registered.");
        }
    }

    private User createUser(
            RegisterRequest request,
            String email) {

        User user = new User();

        user.setEmail(email);
        user.setPasswordHash(
                passwordEncoder.encode(request.password()));
        user.setRole(Role.CUSTOMER);

        return user;
    }

    private Customer createCustomer(
            RegisterRequest request,
            User user,
            String cpf) {

        Customer customer = new Customer();

        customer.setUser(user);
        customer.setName(request.name().trim());
        customer.setRg(request.rg().trim());
        customer.setCpf(cpf);
        customer.setProfession(request.profession().trim());
        customer.setAddress(toAddress(request.address()));
        customer.setIncomes(toIncomes(request.incomes()));

        return customer;
    }

    private Address toAddress(AddressRequest request) {
        Address address = new Address();

        address.setStreet(request.street().trim());
        address.setNumber(request.number().trim());
        address.setComplement(trimToNull(request.complement()));
        address.setDistrict(request.district().trim());
        address.setCity(request.city().trim());
        address.setState(request.state());
        address.setZipCode(request.zipCode());

        return address;
    }

    private List<EmploymentIncome> toIncomes(
            List<EmploymentIncomeRequest> requests) {

        if (requests == null) {
            return new ArrayList<>();
        }

        return new ArrayList<>(requests.stream()
                .map(this::toIncome)
                .toList());
    }

    private EmploymentIncome toIncome(EmploymentIncomeRequest request) {
        EmploymentIncome income = new EmploymentIncome();

        income.setEmployer(request.employer().trim());
        income.setAmount(request.amount());

        return income;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private CustomerResponse toResponse(Customer customer) {
        Address address = customer.getAddress();

        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getUser().getEmail(),
                customer.getRg(),
                customer.getCpf(),
                customer.getProfession(),
                new AddressResponse(
                        address.getStreet(),
                        address.getNumber(),
                        address.getComplement(),
                        address.getDistrict(),
                        address.getCity(),
                        address.getState(),
                        address.getZipCode()),
                customer.getIncomes().stream()
                        .map(income -> new EmploymentIncomeResponse(
                                income.getEmployer(),
                                income.getAmount()))
                        .toList());
    }
}
