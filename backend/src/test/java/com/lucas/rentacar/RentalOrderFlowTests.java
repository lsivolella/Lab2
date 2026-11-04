package com.lucas.rentacar;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;
import com.lucas.rentacar.application.RentacarApplication;
import com.lucas.rentacar.dto.auth.RegisterRequest;
import com.lucas.rentacar.dto.customer.AddressRequest;
import com.lucas.rentacar.enums.AgentType;
import com.lucas.rentacar.repository.AgentRepository;
import com.lucas.rentacar.service.CustomerService;
import com.lucas.rentacar.service.ImageStorageService;
import com.lucas.rentacar.service.ImageType;

/**
 * End-to-end flow of cars and rental orders through the HTTP layer.
 * Runs against the configured database inside a transaction that is rolled
 * back after each test, so no data is left behind. Uses the seeded company
 * and bank agents and creates its own customers.
 */
@SpringBootTest(classes = RentacarApplication.class)
@AutoConfigureMockMvc
@Transactional
class RentalOrderFlowTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private AgentRepository agentRepository;

    // Keeps the tests away from the real Supabase Storage bucket.
    @MockitoBean
    private ImageStorageService imageStorageService;

    // Company agent (owns the cars) and bank agent.
    private RequestPostProcessor agent;
    private RequestPostProcessor bank;
    private RequestPostProcessor customer;
    private RequestPostProcessor otherCustomer;

    @BeforeEach
    void setUp() {
        agent = user(seededAgentEmail(AgentType.COMPANY)).roles("AGENT");
        bank = user(seededAgentEmail(AgentType.BANK)).roles("AGENT");
        customer = user(registerCustomer()).roles("CUSTOMER");
        otherCustomer = user(registerCustomer()).roles("CUSTOMER");
    }

    @Test
    void onlyTheOwnerCompanyManagesItsCars() throws Exception {
        String created = perform(post("/api/cars").content(carJson("120.00")), agent, 201);
        long carId = id(created);
        assertJson(created, "$.owner.name", JsonPath.read(perform(get("/api/users/me"), agent, 200), "$.name"));

        // Banks read the fleet but do not register or change cars.
        perform(get("/api/cars/" + carId), bank, 200);
        perform(post("/api/cars").content(carJson("99.90")), bank, 403);
        perform(put("/api/cars/" + carId).content(carJson("130.00")), bank, 403);
        perform(delete("/api/cars/" + carId), bank, 403);

        assertJson(perform(put("/api/cars/" + carId).content(carJson("130.00")), agent, 200), "$.dailyRate", 130.0);
    }

    @Test
    void ownerCompanyUploadsTheCarImage() throws Exception {
        long carId = createCar("120.00");
        String firstUrl = "https://storage.test/car-images/cars/" + carId + "/first.png";
        String secondUrl = "https://storage.test/car-images/cars/" + carId + "/second.jpg";
        byte[] png = { (byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n', 0, 0 };
        byte[] jpeg = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0 };

        when(imageStorageService.upload(eq("cars/" + carId), any(), eq(ImageType.PNG))).thenReturn(firstUrl);
        when(imageStorageService.upload(eq("cars/" + carId), any(), eq(ImageType.JPEG))).thenReturn(secondUrl);

        // Only the owner company uploads; the format comes from the content, not the name.
        uploadImage(carId, image("photo.png", png), customer, 403);
        uploadImage(carId, image("photo.png", png), bank, 403);
        uploadImage(carId, image("photo.png", "not an image".getBytes()), agent, 400);
        uploadImage(carId, image("huge.png", new byte[2 * 1024 * 1024 + 1]), agent, 413);
        verify(imageStorageService, never()).upload(any(), any(), any());

        assertJson(uploadImage(carId, image("photo.png", png), agent, 200), "$.imageUrl", firstUrl);
        assertJson(perform(get("/api/cars/" + carId), customer, 200), "$.imageUrl", firstUrl);

        // Replacing the image deletes the previous upload from storage.
        assertJson(uploadImage(carId, image("photo.jpg", jpeg), agent, 200), "$.imageUrl", secondUrl);
        verify(imageStorageService).deleteIfStored(firstUrl);
    }

    @Test
    void customerOrdersAndAgentEvaluatesAndContracts() throws Exception {
        long carId = createCar("150.00");
        LocalDate start = LocalDate.now().plusDays(10);

        // Customers cannot manage the fleet, but can read it.
        perform(post("/api/cars").content(carJson("99.90")), customer, 403);
        perform(get("/api/cars/" + carId), customer, 200);

        // Create: 3 days x 150.00.
        String created = perform(post("/api/orders").content(orderJson(carId, start, start.plusDays(3))), customer, 201);
        long orderId = id(created);
        assertJson(created, "$.status", "SUBMITTED");
        assertJson(created, "$.days", 3);
        assertJson(created, "$.totalAmount", 450.0);

        // Same car on overlapping dates; end before start.
        perform(post("/api/orders").content(orderJson(carId, start.plusDays(2), start.plusDays(5))), otherCustomer, 409);
        perform(post("/api/orders").content(orderJson(carId, start, start)), customer, 400);

        // Change dates while submitted: recalculated to 5 days.
        String updated = perform(put("/api/orders/" + orderId).content(orderJson(carId, start, start.plusDays(5))), customer, 200);
        assertJson(updated, "$.totalAmount", 750.0);

        // Other customers cannot see it; agents can.
        perform(get("/api/orders/" + orderId), otherCustomer, 404);
        perform(get("/api/orders/" + orderId), agent, 200);

        // Without credit, only the company that owns the car evaluates;
        // contract requires approval first.
        perform(post("/api/orders/" + orderId + "/evaluation").content(evaluationJson(true)), customer, 403);
        perform(post("/api/orders/" + orderId + "/evaluation").content(evaluationJson(true)), bank, 403);
        perform(post("/api/orders/" + orderId + "/contract").content(contractJson("COMPANY")), agent, 409);

        String evaluated = perform(post("/api/orders/" + orderId + "/evaluation").content(evaluationJson(true)), agent, 200);
        assertJson(evaluated, "$.status", "APPROVED");
        assertJson(evaluated, "$.agentOpinion", "Income compatible with the rental.");
        assertJson(evaluated, "$.creditContract", null);

        // After the opinion the customer can no longer change or cancel.
        perform(put("/api/orders/" + orderId).content(orderJson(carId, start, start.plusDays(4))), customer, 409);
        perform(post("/api/orders/" + orderId + "/cancel"), customer, 409);

        // Bank ownership needs a credit contract; banks do not execute contracts.
        perform(post("/api/orders/" + orderId + "/contract").content(contractJson("BANK")), agent, 400);
        perform(post("/api/orders/" + orderId + "/contract").content(contractJson("COMPANY")), bank, 403);

        String contracted = perform(post("/api/orders/" + orderId + "/contract").content(contractJson("CUSTOMER")), agent, 200);
        assertJson(contracted, "$.status", "CONTRACTED");
        assertJson(contracted, "$.contract.ownershipType", "CUSTOMER");
        assertJson(contracted, "$.contract.owner.name", "Integration Test");

        // A car with orders in progress cannot be deleted.
        perform(delete("/api/cars/" + carId), agent, 409);
    }

    @Test
    void bankEvaluatesOrdersWithCreditAndGrantsTheCreditContract() throws Exception {
        long carId = createCar("100.00");
        LocalDate start = LocalDate.now().plusDays(30);

        // 3 days x 100.00 = 300.00, financed.
        String created = perform(
                post("/api/orders").content(orderJson(carId, start, start.plusDays(3), true)),
                customer,
                201);
        long orderId = id(created);
        assertJson(created, "$.creditRequested", true);

        // Orders with credit are evaluated by a bank, which must set the terms.
        perform(post("/api/orders/" + orderId + "/evaluation").content(evaluationJson(true)), agent, 403);
        perform(post("/api/orders/" + orderId + "/evaluation").content(evaluationJson(true)), bank, 400);

        // 2% a month in 3 installments (Price table): 104.03.
        String evaluated = perform(
                post("/api/orders/" + orderId + "/evaluation").content(creditEvaluationJson("2.00", 3)),
                bank,
                200);
        assertJson(evaluated, "$.status", "APPROVED");
        assertJson(evaluated, "$.creditContract.amount", 300.0);
        assertJson(evaluated, "$.creditContract.installmentAmount", 104.03);

        // The car owner executes the contract, registering the car to the bank.
        String contracted = perform(post("/api/orders/" + orderId + "/contract").content(contractJson("BANK")), agent, 200);
        assertJson(contracted, "$.contract.ownershipType", "BANK");
        assertJson(
                contracted,
                "$.contract.owner.name",
                JsonPath.read(perform(get("/api/users/me"), bank, 200), "$.name"));
    }

    @Test
    void cancelledOrRejectedOrdersFreeTheCar() throws Exception {
        long carId = createCar("100.00");
        LocalDate start = LocalDate.now().plusDays(20);
        String dates = orderJson(carId, start, start.plusDays(2));

        long cancelled = id(perform(post("/api/orders").content(dates), customer, 201));
        assertJson(perform(post("/api/orders/" + cancelled + "/cancel"), customer, 200), "$.status", "CANCELLED");

        long rejected = id(perform(post("/api/orders").content(dates), otherCustomer, 201));
        assertJson(
                perform(post("/api/orders/" + rejected + "/evaluation").content(evaluationJson(false)), agent, 200),
                "$.status",
                "REJECTED");

        // Same dates are free again, and each customer only lists their own orders.
        perform(post("/api/orders").content(dates), customer, 201);
        perform(get("/api/orders?status=CANCELLED"), customer, 200);
        assertJson(perform(get("/api/orders"), customer, 200), "$.page.totalElements", 2);
        assertJson(perform(get("/api/orders"), otherCustomer, 200), "$.page.totalElements", 1);

        // Without orders in progress the car can be deleted (soft delete).
        long freeCar = createCar("80.00");
        perform(delete("/api/cars/" + freeCar), agent, 204);
        perform(get("/api/cars/" + freeCar), agent, 404);
    }

    private String uploadImage(
            long carId,
            MockMultipartFile file,
            RequestPostProcessor user,
            int expectedStatus) throws Exception {

        return mockMvc.perform(multipart(HttpMethod.PUT, "/api/cars/" + carId + "/image")
                .file(file)
                .with(user)
                .with(csrf()))
                .andExpect(status().is(expectedStatus))
                .andReturn()
                .getResponse()
                .getContentAsString();
    }

    private static MockMultipartFile image(String filename, byte[] content) {
        return new MockMultipartFile("file", filename, "image/png", content);
    }

    private long createCar(String dailyRate) throws Exception {
        return id(perform(post("/api/cars").content(carJson(dailyRate)), agent, 201));
    }

    private String perform(
            MockHttpServletRequestBuilder request,
            RequestPostProcessor user,
            int expectedStatus) throws Exception {

        return mockMvc.perform(request
                .contentType(MediaType.APPLICATION_JSON)
                .with(user)
                .with(csrf()))
                .andExpect(status().is(expectedStatus))
                .andReturn()
                .getResponse()
                .getContentAsString();
    }

    private static void assertJson(String json, String path, Object expected) {
        Object actual = JsonPath.read(json, path);

        if (expected instanceof Number number) {
            assertThat(((Number) actual).doubleValue()).isEqualTo(number.doubleValue());
        } else {
            assertThat(actual).isEqualTo(expected);
        }
    }

    private static long id(String json) {
        return ((Number) JsonPath.read(json, "$.id")).longValue();
    }

    private String seededAgentEmail(AgentType type) {
        return agentRepository.findAll().stream()
                .filter(found -> found.getType() == type)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No seeded " + type + " agent."))
                .getUser()
                .getEmail();
    }

    private String registerCustomer() {
        String email = "it." + System.nanoTime() + "@example.com";

        customerService.create(new RegisterRequest(
                "Integration Test",
                "MG123",
                randomCpf(),
                "Tester",
                new AddressRequest("Rua A", "1", null, "Centro", "Belo Horizonte", "MG", "30110000"),
                List.of(),
                email,
                "senha1234"));

        return email;
    }

    private static String carJson(String dailyRate) {
        ThreadLocalRandom random = ThreadLocalRandom.current();
        String registration = String.format("%011d", random.nextLong(100_000_000_000L));
        String plate = "TST" + random.nextInt(10) + (char) ('A' + random.nextInt(26)) + String.format("%02d", random.nextInt(100));

        return """
                {"registration":"%s","year":2024,"brand":"Fiat","model":"Argo","plate":"%s","dailyRate":%s}
                """.formatted(registration, plate, new BigDecimal(dailyRate));
    }

    private static String orderJson(long carId, LocalDate start, LocalDate end) {
        return orderJson(carId, start, end, false);
    }

    private static String orderJson(long carId, LocalDate start, LocalDate end, boolean creditRequested) {
        return """
                {"carId":%d,"startDate":"%s","endDate":"%s","creditRequested":%s}
                """.formatted(carId, start, end, creditRequested);
    }

    private static String evaluationJson(boolean approved) {
        return """
                {"approved":%s,"opinion":"Income compatible with the rental."}
                """.formatted(approved);
    }

    private static String creditEvaluationJson(String monthlyInterestRate, int installments) {
        return """
                {"approved":true,"opinion":"Credit approved.",
                 "credit":{"monthlyInterestRate":%s,"installments":%d}}
                """.formatted(monthlyInterestRate, installments);
    }

    private static String contractJson(String ownershipType) {
        return """
                {"ownershipType":"%s"}
                """.formatted(ownershipType);
    }

    /** Random CPF with valid check digits. */
    private static String randomCpf() {
        int[] digits = new int[11];
        ThreadLocalRandom random = ThreadLocalRandom.current();

        for (int i = 0; i < 9; i++) {
            digits[i] = random.nextInt(10);
        }

        for (int position = 9; position < 11; position++) {
            int sum = 0;

            for (int i = 0; i < position; i++) {
                sum += digits[i] * (position + 1 - i);
            }

            int remainder = (sum * 10) % 11;
            digits[position] = remainder == 10 ? 0 : remainder;
        }

        StringBuilder cpf = new StringBuilder();

        for (int digit : digits) {
            cpf.append(digit);
        }

        return cpf.toString();
    }
}
