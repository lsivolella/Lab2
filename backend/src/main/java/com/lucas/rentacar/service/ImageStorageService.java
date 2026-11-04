package com.lucas.rentacar.service;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import com.lucas.rentacar.config.StorageProperties;

/**
 * Stores images in a public Supabase Storage bucket through its REST API.
 * Only the backend talks to Storage, with the secret key from backend/.env;
 * the browser just reads the public URL returned by upload().
 */
@Service
@EnableConfigurationProperties(StorageProperties.class)
public class ImageStorageService {

    private static final Logger log = LoggerFactory.getLogger(ImageStorageService.class);

    private final StorageProperties properties;
    private final RestClient restClient;

    public ImageStorageService(StorageProperties properties) {
        this.properties = properties;
        this.restClient = properties.isConfigured()
                ? RestClient.builder()
                        .baseUrl(properties.url() + "/storage/v1")
                        .defaultHeader("apikey", properties.serviceKey())
                        .defaultHeader("Authorization", "Bearer " + properties.serviceKey())
                        .build()
                : null;
    }

    /**
     * Uploads the image under folder/ with a random name and returns its
     * public URL.
     */
    public String upload(String folder, byte[] bytes, ImageType type) {
        requireConfigured();

        String path = folder + "/" + UUID.randomUUID() + "." + type.extension();

        try {
            restClient.post()
                    .uri("/object/{bucket}/{path}", properties.bucket(), path)
                    .contentType(MediaType.parseMediaType(type.contentType()))
                    .body(bytes)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.error("Image upload to storage failed: {}", e.getMessage());

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Image storage is unavailable. Try again later.");
        }

        return publicUrlPrefix() + path;
    }

    /**
     * Deletes an image previously returned by upload(). URLs that do not point
     * to this bucket (e.g. seed images served by the frontend) are ignored.
     * Failures are only logged: a leftover file must not break the caller.
     */
    public void deleteIfStored(String imageUrl) {
        if (restClient == null || imageUrl == null || !imageUrl.startsWith(publicUrlPrefix())) {
            return;
        }

        String path = imageUrl.substring(publicUrlPrefix().length());

        try {
            restClient.delete()
                    .uri("/object/{bucket}/{path}", properties.bucket(), path)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Could not delete old image {}: {}", path, e.getMessage());
        }
    }

    private String publicUrlPrefix() {
        return properties.url() + "/storage/v1/object/public/" + properties.bucket() + "/";
    }

    private void requireConfigured() {
        if (restClient == null) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Image storage is not configured.");
        }
    }
}
