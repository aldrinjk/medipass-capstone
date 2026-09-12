package com.medipass.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medipass.common.error.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Emits the same JSON error envelope as {@link ApiAuthenticationEntryPoint}
 * for authenticated-but-unauthorized requests (e.g. a PATIENT role calling an
 * admin-only endpoint), instead of Spring Security's default empty 403 body.
 */
@Component
public class ApiAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public ApiAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiError error = ApiError.of(
                HttpServletResponse.SC_FORBIDDEN,
                "FORBIDDEN",
                "You do not have permission to access this resource.",
                request.getRequestURI()
        );

        objectMapper.writeValue(response.getOutputStream(), error);
    }
}
