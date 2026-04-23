package com.keyurpandav.jobber.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Map;

@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public Object handleError(HttpServletRequest request) {
        Integer statusCode = resolveStatusCode(request);
        String requestUri = resolveRequestUri(request);

        if (requestUri.startsWith("/api/")) {
            HttpStatus status = HttpStatus.resolve(statusCode);
            HttpStatus responseStatus = status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR;
            return ResponseEntity.status(responseStatus).body(Map.of(
                    "error", buildMessage(statusCode),
                    "status", statusCode
            ));
        }

        return "forward:/index.html";
    }

    private Integer resolveStatusCode(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        if (status == null) {
            return 500;
        }

        try {
            return Integer.parseInt(status.toString());
        } catch (NumberFormatException ignored) {
            return 500;
        }
    }

    private String resolveRequestUri(HttpServletRequest request) {
        Object uri = request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        return uri == null ? "" : uri.toString();
    }

    private String buildMessage(Integer statusCode) {
        return switch (statusCode) {
            case 401 -> "Unauthorized";
            case 403 -> "Access denied";
            case 404 -> "Not found";
            default -> "Unexpected server error";
        };
    }
}
