package responders;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import dto.UserDto;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
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
    protected BaseService<User, AddUserCommand> getService() {
        return userService;
    }

    @Override
    protected CommandToEntityMapper<User, AddUserCommand, UpdateUserCommand, UserDto> getMapper() {
        return userMapper;
    }

    @Transactional
    public UserDto updateByUsername(String username, UserDto dto) {
        User entity = userService.findByUsername(username);
        if (entity == null) throw new NotFoundException("User not found: " + username);
        UpdateUserCommand cmd = new UpdateUserCommand();
        cmd.name = dto.name;
        cmd.score = dto.score;
        cmd.password = entity.password; // preserve existing password
        userMapper.updateEntity(entity, cmd);
        return userMapper.mapToDto(entity);
    }

    @Transactional
    public void deleteByUsername(String username) {
        userService.deleteByUsername(username);
    }
}
