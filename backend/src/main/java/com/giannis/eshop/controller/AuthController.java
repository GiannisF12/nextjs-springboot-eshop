package com.giannis.eshop.controller;

import com.giannis.eshop.dto.AuthUserResponse;
import com.giannis.eshop.dto.LoginRequest;
import com.giannis.eshop.dto.RegisterRequest;
import com.giannis.eshop.model.AppUser;
import com.giannis.eshop.validation.StrongPassword;
import com.giannis.eshop.model.Gender;
import com.giannis.eshop.model.Role;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.Period;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private static final int MIN_AGE_YEARS = 16;

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

        return toResponse(user);
    }

    @PostMapping("/login")
    public AuthUserResponse login(@Valid @RequestBody LoginRequest req,
                                  HttpServletRequest request,
                                  HttpServletResponse response) {
        String email = normalizeEmail(req.email());

        Authentication auth;
        try {
            auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, req.password())
            );
        } catch (LockedException e) {
            // Banned users get a specific 403 so the frontend can show
            // a clear "account banned" message instead of a generic error.
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This account has been banned. Please contact support."
            );
        } catch (AuthenticationException e) {
            // Wrong email/password (and any other auth failure that isn't a
            // ban) → 401 with a generic message. Without this, the exception
            // bubbles up to the security entry point, which returns 403 with
            // formLogin/httpBasic disabled — making bad credentials look like
            // a ban. Kept generic so we don't reveal whether the email exists.
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password."
            );
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        request.getSession(true); // force session creation (so JSESSIONID is issued)
        securityContextRepository.saveContext(context, request, response);

        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return toResponse(user);
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
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        String email = auth.getName();
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in"));
        return toResponse(user);
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

        // Age check: when birthday is provided, user must be at least MIN_AGE_YEARS old.
        if (req.birthday() != null) {
            if (req.birthday().isAfter(LocalDate.now())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Birthday cannot be in the future");
            }
            int age = Period.between(req.birthday(), LocalDate.now()).getYears();
            if (age < MIN_AGE_YEARS) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "You must be at least " + MIN_AGE_YEARS + " years old."
                );
            }
        }

        user.setName(req.name().trim());
        user.setEmail(newEmail);
        user.setGender(req.gender());
        user.setBirthday(req.birthday());
        userRepository.save(user);

        return toResponse(user);
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private static AuthUserResponse toResponse(AppUser user) {
        return new AuthUserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getGender(),
                user.getBirthday()
        );
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
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Email String email,
            Gender gender,          // optional
            LocalDate birthday      // optional (ISO yyyy-MM-dd)
    ) {}

    record ChangePasswordRequest(
            @jakarta.validation.constraints.NotBlank String currentPassword,
            @jakarta.validation.constraints.NotBlank
            @StrongPassword
            String newPassword
    ) {}
}
