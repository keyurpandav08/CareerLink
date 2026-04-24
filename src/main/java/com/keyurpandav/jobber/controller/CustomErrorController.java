package com.keyurpandav.jobber.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.LinkedHashMap;
import java.util.Map;

@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public Object handleError(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        int statusCode = status != null ? Integer.parseInt(status.toString()) : HttpStatus.INTERNAL_SERVER_ERROR.value();

        // This app serves a React SPA from static resources, so browser navigation
        // should fall back to index.html instead of a server-side template.
        if (wantsHtml(request) && !isApiRequest(request) && statusCode != HttpStatus.INTERNAL_SERVER_ERROR.value()) {
            return "forward:/index.html";
        }

        HttpStatus httpStatus = HttpStatus.resolve(statusCode);
        String message = switch (statusCode) {
            case 403 -> "Access denied";
            case 404 -> "Resource not found";
            case 500 -> "Internal server error";
            default -> "An unexpected error occurred";
        };

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", statusCode);
        body.put("error", httpStatus != null ? httpStatus.getReasonPhrase() : "Unknown");
        body.put("message", message);
        body.put("path", request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI));

        return ResponseEntity.status(httpStatus != null ? httpStatus : HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }

    private boolean isApiRequest(HttpServletRequest request) {
        Object requestUri = request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        if (requestUri instanceof String uri && uri.startsWith("/api/")) {
            return true;
        }

        String servletPath = request.getServletPath();
        return servletPath != null && servletPath.startsWith("/api/");
    }

    private boolean wantsHtml(HttpServletRequest request) {
        String accept = request.getHeader("Accept");
        return accept != null && accept.contains(MediaType.TEXT_HTML_VALUE);
    }
}
