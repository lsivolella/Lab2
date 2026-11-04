package com.lucas.rentacar.service;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import com.lucas.rentacar.dto.address.AddressLookupResponse;

/**
 * Finds an address by ZIP code (CEP) using ViaCEP (https://viacep.com.br), a
 * free public API. The frontend calls this backend endpoint instead of ViaCEP
 * directly, so the browser only ever talks to our API.
 */
@Service
public class AddressLookupService {

    private static final Logger log = LoggerFactory.getLogger(AddressLookupService.class);

    /** ViaCEP JSON; "erro" is true when the CEP does not exist. */
    record ViaCepResponse(
            String cep,
            String logradouro,
            String bairro,
            String localidade,
            String uf,
            Boolean erro) {
    }

    private final RestClient restClient;

    public AddressLookupService() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(3));
        requestFactory.setReadTimeout(Duration.ofSeconds(3));

        this.restClient = RestClient.builder()
                .baseUrl("https://viacep.com.br/ws")
                .requestFactory(requestFactory)
                .build();
    }

    public AddressLookupResponse findByZipCode(String zipCode) {
        if (zipCode == null || !zipCode.matches("\\d{8}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "ZIP code must contain exactly 8 digits.");
        }

        ViaCepResponse response;

        try {
            response = restClient.get()
                    .uri("/{cep}/json/", zipCode)
                    .retrieve()
                    .body(ViaCepResponse.class);
        } catch (RestClientException e) {
            log.warn("ZIP code lookup failed: {}", e.getMessage());

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Address lookup is unavailable. Fill in the address manually.");
        }

        if (response == null || Boolean.TRUE.equals(response.erro())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "ZIP code not found.");
        }

        return new AddressLookupResponse(
                zipCode,
                response.logradouro(),
                response.bairro(),
                response.localidade(),
                response.uf());
    }
}
