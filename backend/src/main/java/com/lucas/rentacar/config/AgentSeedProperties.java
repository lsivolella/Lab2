package com.lucas.rentacar.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

import com.lucas.rentacar.enums.AgentType;

@ConfigurationProperties(prefix = "app.seed")
public record AgentSeedProperties(List<SeedAgent> agents) {

    public AgentSeedProperties {
        agents = agents == null ? List.of() : agents;
    }

    public record SeedAgent(
            String name,
            String cnpj,
            AgentType type,
            String email,
            String password) {
    }
}
