package commands;

import entities.User;

public class UpdateUserCommand extends UpdateCommand<User> {
    public String name;
    public String password;
    public Integer score;
}
