package services;

/**
 * Thrown when renaming a week's extra table to a name the week already uses.
 */
public class ShiftTableNameTakenException extends RuntimeException {

    public ShiftTableNameTakenException(String name) {
        super("כבר יש השבוע טבלה בשם \"" + name + "\"");
    }

}
