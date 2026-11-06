package dev.algovision.learning.web;

import dev.algovision.learning.core.LearningException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Maps the framework-free {@link LearningException} to the API's Problem Details shape. */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LearningExceptionHandler {

    @ExceptionHandler(LearningException.class)
    public ResponseEntity<ProblemDetail> handle(LearningException ex) {
        HttpStatus status = switch (ex.code()) {
            case INVALID_INPUT -> HttpStatus.BAD_REQUEST;
            case ALGORITHM_NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        ProblemDetail body = ProblemDetail.forStatusAndDetail(status, ex.getMessage());
        body.setTitle(status.getReasonPhrase());
        body.setProperty("code", ex.code().name());
        return ResponseEntity.status(status).cacheControl(CacheControl.noStore()).body(body);
    }
}
