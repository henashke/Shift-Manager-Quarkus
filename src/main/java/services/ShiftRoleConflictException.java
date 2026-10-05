package services;

/**
 * Thrown when the same user would fill two roles (regular, shadow, jump) of one shift in the same table.
 */
public class ShiftRoleConflictException extends RuntimeException {

    public ShiftRoleConflictException(String username) {
        super("\"" + username + "\" כבר משובץ בתפקיד אחר במשמרת הזו");
    }

}
