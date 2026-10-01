package services;

/**
 * Thrown when assigning a user to a shift they marked as CANT.
 */
public class ShiftConstraintViolationException extends RuntimeException {

    public ShiftConstraintViolationException(String username) {
        super("יש ל\"" + username + "\" אילוץ במשמרת הזו");
    }

}
