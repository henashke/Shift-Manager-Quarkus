package mappers.user;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import dto.UserDto;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import mappers.DtoToCommandMapper;

@ApplicationScoped
public class UserDtoToCommandMapper implements DtoToCommandMapper<UserDto, User, AddUserCommand, UpdateUserCommand> {

    @Override
    public AddUserCommand mapToAddCommand(UserDto dto) {
        AddUserCommand cmd = new AddUserCommand();
        cmd.name = dto.name;
        cmd.score = dto.score;
        return cmd;
    }

    @Override
    public UpdateUserCommand mapToUpdateCommand(UserDto dto) {
        UpdateUserCommand cmd = new UpdateUserCommand();
        cmd.name = dto.name;
        cmd.score = dto.score;
        return cmd;
    }

    @Override
    public UserDto mapToDto(User entity) {
        UserDto dto = new UserDto();
        dto.name = entity.name;
        dto.score = entity.score;
        return dto;
    }
}
