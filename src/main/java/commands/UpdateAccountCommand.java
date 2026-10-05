package commands;

// Changes the signed-in user's own account; leave a field null to keep it
public class UpdateAccountCommand {
    public String username;
    public String currentPassword;
    public String newPassword;
}
