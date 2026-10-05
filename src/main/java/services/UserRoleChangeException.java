package services;

// A role change that would leave the system without an admin, or an admin without their own access
public class UserRoleChangeException extends RuntimeException {

    public UserRoleChangeException(String message) {
        super(message);
    }

}
