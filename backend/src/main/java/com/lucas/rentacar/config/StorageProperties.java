package com.lucas.rentacar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Supabase Storage settings (app.storage.* in application.properties). */
@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(String url, String serviceKey, String bucket) {

    public boolean isConfigured() {
        return url != null && !url.isBlank()
                && serviceKey != null && !serviceKey.isBlank();
    }
}
