package com.medipass.common.error;

import com.medipass.auth.EmailAlreadyRegisteredException;
import com.medipass.auth.InvalidCredentialsException;
import com.medipass.auth.InvalidRefreshTokenException;
import com.medipass.pass.PassNotFoundException;
import com.medipass.pass.PassStatus;
import com.medipass.pass.PublicPassGoneException;
import com.medipass.pass.PublicPassNotFoundException;
import com.medipass.patient.ClinicalResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.putIfAbsent(error.getField(), error.getDefaultMessage())
        );

        ApiError body = new ApiError(
                java.time.Instant.now(),
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                "Request validation failed.",
                request.getRequestURI(),
                errors
        );

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request
    ) {
        return ResponseEntity.badRequest().body(
                ApiError.of(
                        HttpStatus.BAD_REQUEST.value(),
                        "VALIDATION_ERROR",
                        "Request validation failed.",
                        request.getRequestURI()
                )
        );
    }

    @ExceptionHandler(EmailAlreadyRegisteredException.class)
    public ResponseEntity<ApiError> handleEmailAlreadyRegistered(
            EmailAlreadyRegisteredException ex,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                ApiError.of(
                        HttpStatus.CONFLICT.value(),
                        "EMAIL_ALREADY_REGISTERED",
                        ex.getMessage(),
                        request.getRequestURI()
                )
        );
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiError> handleInvalidCredentials(
            InvalidCredentialsException ex,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                ApiError.of(
                        HttpStatus.UNAUTHORIZED.value(),
                        "INVALID_CREDENTIALS",
                        ex.getMessage(),
                        request.getRequestURI()
                )
        );
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<ApiError> handleInvalidRefreshToken(
            InvalidRefreshTokenException ex,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                ApiError.of(
                        HttpStatus.UNAUTHORIZED.value(),
                        "INVALID_REFRESH_TOKEN",
                        ex.getMessage(),
                        request.getRequestURI()
                )
        );
    }

    @ExceptionHandler(ClinicalResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleClinicalResourceNotFound(
            ClinicalResourceNotFoundException ex,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                ApiError.of(
                        HttpStatus.NOT_FOUND.value(),
                        "CLINICAL_RESOURCE_NOT_FOUND",
                        ex.getMessage(),
                        request.getRequestURI()
                )
        );
    }

    @ExceptionHandler(PassNotFoundException.class)
    public ResponseEntity<ApiError> handlePassNotFound(
            PassNotFoundException ex,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                ApiError.of(
                        HttpStatus.NOT_FOUND.value(),
                        "PASS_NOT_FOUND",
                        ex.getMessage(),
                        request.getRequestURI()
                )
        );
    }

    @ExceptionHandler(PublicPassNotFoundException.class)
    public ResponseEntity<ApiError> handlePublicPassNotFound(
            PublicPassNotFoundException ex,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                ApiError.of(
                        HttpStatus.NOT_FOUND.value(),
                        "PUBLIC_PASS_NOT_FOUND",
                        ex.getMessage(),
                        request.getRequestURI()
                )
        );
    }

    @ExceptionHandler(PublicPassGoneException.class)
    public ResponseEntity<ApiError> handlePublicPassGone(
            PublicPassGoneException ex,
            HttpServletRequest request
    ) {
        String code = ex.getPassStatus() == PassStatus.REVOKED
                ? "PUBLIC_PASS_REVOKED"
                : "PUBLIC_PASS_EXPIRED";

        return ResponseEntity.status(HttpStatus.GONE).body(
                ApiError.of(
                        HttpStatus.GONE.value(),
                        code,
                        ex.getMessage(),
                        request.getRequestURI()
                )
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(
            Exception ex,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiError.of(
                        HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        "INTERNAL_ERROR",
                        "An unexpected server error occurred.",
                        request.getRequestURI()
                )
        );
    }
}
