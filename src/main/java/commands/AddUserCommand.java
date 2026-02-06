package commands;

import entities.User;

public class AddUserCommand extends AddCommand<User> {
    public String name;
    public String password;
    public Integer score;
}
