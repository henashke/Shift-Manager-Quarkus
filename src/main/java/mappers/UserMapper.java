package mappers;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import dto.UserDto;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserMapper implements CommandToEntityMapper<User, AddUserCommand, UpdateUserCommand, UserDto> {

    @Override
    public User mapToEntity(AddUserCommand addCommand) {
        User user = new User();
        user.name = addCommand.name;
        user.password = addCommand.password;
        user.score = addCommand.score;
        return user;
    }

    @Override
    public void updateEntity(User entity, UpdateUserCommand updateCommand) {
        entity.name = updateCommand.name;
        entity.password = updateCommand.password;
        entity.score = updateCommand.score;
    }

    @Override
    public UserDto mapToDto(User entity) {
        UserDto dto = new UserDto();
        dto.name = entity.name;
        dto.score = entity.score;
        return dto;
    }
}
