package com.lucas.rentacar.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.lucas.rentacar.config.AgentSeedProperties.SeedAgent;
import com.lucas.rentacar.enums.Role;
import com.lucas.rentacar.model.Agent;
import com.lucas.rentacar.model.User;
import com.lucas.rentacar.repository.AgentRepository;
import com.lucas.rentacar.repository.UserRepository;
import com.lucas.rentacar.service.UserService;

/**
 * Creates the agent accounts (companies and banks) listed under app.seed.agents
 * on startup. Agents cannot self-register, so this is the only way they are
 * created. Existing accounts (same email or CNPJ) are left untouched.
 */
@Component
@EnableConfigurationProperties(AgentSeedProperties.class)
public class AgentSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AgentSeeder.class);

    private final AgentSeedProperties properties;
    private final UserRepository userRepository;
    private final AgentRepository agentRepository;
    private final PasswordEncoder passwordEncoder;

    public AgentSeeder(
            AgentSeedProperties properties,
            UserRepository userRepository,
            AgentRepository agentRepository,
            PasswordEncoder passwordEncoder) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.agentRepository = agentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (SeedAgent seed : properties.agents()) {
            seed(seed);
        }
    }

    private void seed(SeedAgent seed) {
        if (seed.password() == null || seed.password().isBlank()) {
            log.warn("Skipping seed agent '{}': no password configured.", seed.name());
            return;
        }

        String email = UserService.normalizeEmail(seed.email());

        if (userRepository.existsByEmail(email)
                || agentRepository.existsByCnpj(seed.cnpj())) {
            return;
        }

        User user = new User();

        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(seed.password()));
        user.setRole(Role.AGENT);

        Agent agent = new Agent();

        agent.setUser(userRepository.save(user));
        agent.setName(seed.name());
        agent.setCnpj(seed.cnpj());
        agent.setType(seed.type());

        agentRepository.save(agent);

        log.info("Seed agent created: {} ({}).", seed.name(), seed.type());
    }
}
