package responders;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import dto.UserDto;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import mappers.CommandToEntityMapper;
import mappers.UserMapper;
import services.BaseService;
import services.UserService;

@ApplicationScoped
public class UserResponder extends BaseResponder<User, AddUserCommand, UpdateUserCommand, UserDto> {

    @Inject
    UserService userService;

    @Inject
    UserMapper userMapper;

    @Override
    protected BaseService<User> getService() {
        return userService;
    }

    @Override
    protected CommandToEntityMapper<User, AddUserCommand, UpdateUserCommand, UserDto> getMapper() {
        return userMapper;
    }
}
