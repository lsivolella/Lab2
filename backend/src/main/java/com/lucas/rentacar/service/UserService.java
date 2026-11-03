package com.lucas.rentacar.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.lucas.rentacar.dto.auth.RegisterRequest;
import com.lucas.rentacar.dto.customer.AddressRequest;
import com.lucas.rentacar.dto.customer.EmploymentIncomeRequest;
import com.lucas.rentacar.dto.user.UserResponse;
import com.lucas.rentacar.enums.Role;
import com.lucas.rentacar.model.Address;
import com.lucas.rentacar.model.Customer;
import com.lucas.rentacar.model.EmploymentIncome;
import com.lucas.rentacar.model.User;
import com.lucas.rentacar.repository.CustomerRepository;
import com.lucas.rentacar.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse create(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        String cpf = request.cpf();

        ensureUniqueData(email, cpf);

        User savedUser = userRepository.save(createUser(request, email));
        Customer savedCustomer = customerRepository.save(
                createCustomer(request, savedUser, cpf));

        return toResponse(savedUser, savedCustomer);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
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

        return requests.stream()
                .map(this::toIncome)
                .collect(Collectors.toCollection(ArrayList::new));
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

    private UserResponse toResponse(User user, Customer customer) {
        return new UserResponse(
                user.getId(),
                customer.getName(),
                user.getEmail(),
                user.getRole());
    }
}
