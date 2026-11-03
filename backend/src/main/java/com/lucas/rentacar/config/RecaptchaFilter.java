package com.lucas.rentacar.config;

import java.io.IOException;

import org.springframework.web.filter.OncePerRequestFilter;

import com.lucas.rentacar.service.RecaptchaService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class RecaptchaFilter extends OncePerRequestFilter {

    private final RecaptchaService recaptchaService;

    public RecaptchaFilter(
            RecaptchaService recaptchaService) {
        this.recaptchaService = recaptchaService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        if (request.getRequestURI().equals("/login")
                && request.getMethod().equalsIgnoreCase("POST")) {

            String captchaResponse = request.getParameter(
                    "g-recaptcha-response");

            boolean captchaValid = recaptchaService.validate(
                    captchaResponse);

            if (!captchaValid) {
                response.sendRedirect(
                        "/login?captcha=true");
                return;
            }
        }

        filterChain.doFilter(
                request,
                response);
    }
}
