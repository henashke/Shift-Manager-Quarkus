package responders;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import dto.UserDto;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import mappers.user.UserDtoToCommandMapper;
import services.BaseService;
import services.UserService;

@ApplicationScoped
public class UserResponder extends BaseResponder<User, AddUserCommand, UpdateUserCommand, UserDto> {

    @Inject
    UserService service;

    @Inject
    UserDtoToCommandMapper dtoToCommandMapper;

    @Override
    protected BaseService<User, AddUserCommand, UpdateUserCommand> getService() {
        return service;
    }

    @Override
    protected UserDtoToCommandMapper getDtoToCommandMapper() {
        return dtoToCommandMapper;
    }

    @Transactional
    public Response updateByUsername(String username, UserDto dto) {
        User entity = service.findByUsername(username);
        if (entity == null) throw new NotFoundException("User not found: " + username);
        UpdateUserCommand updateUserCommand = dtoToCommandMapper.mapToUpdateCommand(dto);
        User updatedUser = service.update(entity.id, updateUserCommand);
        return Response.ok(dtoToCommandMapper.mapToDto(updatedUser)).build();
    }

    @Transactional
    public Response deleteByUsername(String username) {
        service.deleteByUsername(username);
        return Response.noContent().build();
    }
}
