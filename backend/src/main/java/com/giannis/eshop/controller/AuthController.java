package com.giannis.eshop.controller;

import com.giannis.eshop.dto.AuthUserResponse;
import com.giannis.eshop.dto.LoginRequest;
import com.giannis.eshop.model.AppUser;
import com.giannis.eshop.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserRepository userRepository;
    private final SecurityContextRepository securityContextRepository;

    @PostMapping("/login")
    public AuthUserResponse login(@Valid @RequestBody LoginRequest req,
                                  HttpServletRequest request,
                                  HttpServletResponse response) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        request.getSession(true); // force session creation (so JSESSIONID is issued)
        securityContextRepository.saveContext(context, request, response);

        AppUser user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new AuthUserResponse(user.getId(), user.getEmail(), user.getRole());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        request.getSession(false); // ensure session exists if created
        SecurityContextHolder.clearContext();
        var session = request.getSession(false);
        if (session != null) session.invalidate();
    }

    @GetMapping("/me")
    public AuthUserResponse me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        String email = auth.getName();
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in"));
        return new AuthUserResponse(user.getId(), user.getEmail(), user.getRole());
    }
}