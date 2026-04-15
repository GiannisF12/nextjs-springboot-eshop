package com.giannis.eshop.controller;

import com.giannis.eshop.dto.AuthUserResponse;
import com.giannis.eshop.dto.LoginRequest;
import com.giannis.eshop.dto.RegisterRequest;
import com.giannis.eshop.model.AppUser;
import com.giannis.eshop.model.Role;
import com.giannis.eshop.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityContextRepository securityContextRepository;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthUserResponse register(@Valid @RequestBody RegisterRequest req,
                                     HttpServletRequest request,
                                     HttpServletResponse response) {
        String email = normalizeEmail(req.email());

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        AppUser user = AppUser.builder()
                .email(email)
                .name(req.name().trim())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(Role.USER)
                .build();

        userRepository.save(user);

        // Log the user in immediately after registration
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, req.password())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        request.getSession(true);
        securityContextRepository.saveContext(context, request, response);

        return new AuthUserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole());
    }

    @PostMapping("/login")
    public AuthUserResponse login(@Valid @RequestBody LoginRequest req,
                                  HttpServletRequest request,
                                  HttpServletResponse response) {
        String email = normalizeEmail(req.email());

        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, req.password())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        request.getSession(true); // force session creation (so JSESSIONID is issued)
        securityContextRepository.saveContext(context, request, response);

        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new AuthUserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole());
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
        return new AuthUserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole());
    }

    @PutMapping("/me")
    public AuthUserResponse updateProfile(@Valid @RequestBody UpdateProfileRequest req,
                                          Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }

        AppUser user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in"));

        String newEmail = normalizeEmail(req.email());

        // If email is actually changing, make sure it's not taken by someone else
        if (!newEmail.equals(user.getEmail())
                && userRepository.existsByEmail(newEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        user.setName(req.name().trim());
        user.setEmail(newEmail);
        userRepository.save(user);

        return new AuthUserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole());
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    @PutMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest req,
                               Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }

        AppUser user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in"));

        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
    }

    record UpdateProfileRequest(
            @jakarta.validation.constraints.NotBlank String name,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Email String email
    ) {}

    record ChangePasswordRequest(
            @jakarta.validation.constraints.NotBlank String currentPassword,
            @jakarta.validation.constraints.NotBlank
            @jakarta.validation.constraints.Size(min = 6, message = "New password must be at least 6 characters")
            String newPassword
    ) {}
}