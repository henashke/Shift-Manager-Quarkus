package services;

// A rejected account change (wrong current password, nothing to change, an invalid value); the message is shown to the user
public class AccountUpdateException extends RuntimeException {

    public AccountUpdateException(String message) {
        super(message);
    }

}
