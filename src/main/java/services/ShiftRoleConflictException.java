package services;

/**
 * Thrown when the same user would fill two roles (regular, shadow, jump) of the same shift.
 */
public class ShiftRoleConflictException extends RuntimeException {

    public ShiftRoleConflictException(String username) {
        super("\"" + username + "\" כבר משובץ בתפקיד אחר במשמרת הזו");
    }

}
