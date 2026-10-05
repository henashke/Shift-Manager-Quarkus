package responders;

import auth.RoleConstants;
import commands.AddUserCommand;
import commands.SetReserveCommand;
import commands.SetRoleCommand;
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
import services.UserRoleChangeException;
import services.UserService;

import java.util.List;

import static responders.ErrorResponses.error;

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

    public List<UserDto> listSchedulable() {
        return dtoToCommandMapper.mapToDto(service.listSchedulable());
    }

    @Transactional
    public Response setReserve(String username, SetReserveCommand command) {
        if (command == null || command.reserve == null) return error(Response.Status.BAD_REQUEST, "reserve is required");
        User user = requireUser(username);
        service.setReserve(user, command.reserve);
        return Response.ok(dtoToCommandMapper.mapToDto(user)).build();
    }

    @Transactional
    public Response setRole(String username, SetRoleCommand command, String actingUsername) {
        if (command == null || !(RoleConstants.ADMIN.equals(command.role) || RoleConstants.USER.equals(command.role))) {
            return error(Response.Status.BAD_REQUEST, "role must be 'admin' or 'user'");
        }
        User user = requireUser(username);
        try {
            service.setRole(user, command.role, actingUsername);
        } catch (UserRoleChangeException e) {
            return error(Response.Status.CONFLICT, e.getMessage());
        }
        return Response.ok(dtoToCommandMapper.mapToDto(user)).build();
    }

    private User requireUser(String username) {
        User user = service.findByUsername(username);
        if (user == null) throw new NotFoundException("User not found: " + username);
        return user;
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
