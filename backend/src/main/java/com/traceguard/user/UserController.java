package com.traceguard.user;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {
    private final UserManagementService userManagementService;

    public UserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public Map<String, Object> list() {
        List<ManagedUserResponse> users = userManagementService.list();
        return Map.of("content", users, "users", users);
    }

    @PostMapping
    public ResponseEntity<ManagedUserResponse> create(@Valid @RequestBody UserManagementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userManagementService.create(request));
    }

    @PatchMapping("/{id}")
    public ManagedUserResponse update(@PathVariable long id, @Valid @RequestBody UserUpdateRequest request) {
        return userManagementService.update(id, request);
    }
}

@RestControllerAdvice(assignableTypes = UserController.class)
class UserManagementErrorHandler {
    @ExceptionHandler(UserManagementException.class)
    public ResponseEntity<Map<String, String>> handleManagementError(UserManagementException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(Map.of("error", exception.getStatus().getReasonPhrase().toLowerCase(),
                        "message", exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst().map(error -> error.getField() + " " + error.getDefaultMessage())
                .orElse("Request validation failed");
        return ResponseEntity.badRequest().body(Map.of("error", "bad_request", "message", message));
    }
}
