package com.civic.grievance.controller;

import com.civic.grievance.entity.User;
import com.civic.grievance.repository.UserRepository;
import com.civic.grievance.security.JwtService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "Email already registered"));
        }

        User user = User.builder()
            .name(req.getName())
            .email(req.getEmail())
            .passwordHash(passwordEncoder.encode(req.getPassword()))
            .role(User.Role.CITIZEN)
            .department(User.Department.NONE)
            .active(true)
            .build();

        User saved = userRepository.save(user);
        return ResponseEntity.ok(buildAuthResponse(saved));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        return userRepository.findByEmail(req.getEmail())
            .filter(u -> Boolean.TRUE.equals(u.getActive()))
            .filter(u -> passwordEncoder.matches(req.getPassword(), u.getPasswordHash()))
            .<ResponseEntity<?>>map(u -> ResponseEntity.ok(buildAuthResponse(u)))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid credentials or inactive account")));
    }

    private Map<String, Object> buildAuthResponse(User u) {
        return Map.of(
            "token", jwtService.generateToken(u),
            "userId", u.getId(),
            "name", u.getName(),
            "email", u.getEmail(),
            "role", u.getRole().name(),
            "department", u.getDepartment().name()
        );
    }
}
