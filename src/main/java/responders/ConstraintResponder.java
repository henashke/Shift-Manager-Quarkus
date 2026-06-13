package responders;

import commands.AddConstraintCommand;
import commands.DeleteConstraintCommand;
import commands.UpdateConstraintCommand;
import daos.UserDao;
import dto.ConstraintDto;
import dto.DeleteConstraintDto;
import entities.Constraint;
import entities.User;
import enums.ConstraintType;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import lombok.Getter;
import mappers.ConstraintMapper;
import resources.ConstraintResource;
import services.ConstraintService;

import java.util.List;

@ApplicationScoped
@Getter
public class ConstraintResponder extends BaseResponder<Constraint, AddConstraintCommand, UpdateConstraintCommand, ConstraintDto> {

    @Inject
    ConstraintService service;

    @Inject
    ConstraintMapper constraintMapper;

    @Inject
    UserDao userDao;

    @Inject
    ConstraintMapper mapper;

    public ConstraintMapper getMapper() {
        return mapper;
    }

    public ConstraintService getService() {
        return service;
    }

    public List<ConstraintDto> listByUser(String username, boolean isAdmin) {
        User user = userDao.findByUsername(username).orElse(null);
        if (user == null) throw new NotFoundException("User not found: " + username);
        List<Constraint> constraints = isAdmin ? service.findAll() : service.findByUserId(user.id);
        return constraintMapper.mapToDto(constraints);
    }

    public List<ConstraintDto> findByUserId(Long userId) {
        return constraintMapper.mapToDto(service.findByUserId(userId));
    }

    @Transactional
    public void create(ConstraintDto dto) throws Exception {
        AddConstraintCommand cmd = toCommand(dto);
        service.create(cmd);
    }

    public Response create(List<ConstraintDto> dtos) {
        try {
            for (ConstraintDto dto : dtos) {
                create(dto);
            }
            return Response.status(Response.Status.CREATED).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ConstraintResource.ErrorResponse(e.getMessage())).build();
        }
    }

    @Transactional
    public Response delete(DeleteConstraintDto dto) {
        User user = userDao.findByUsername(dto.userId).orElse(null);
        if (user == null) return Response.ok().build();
        DeleteConstraintCommand cmd = new DeleteConstraintCommand();
        cmd.userId = user.id;
        cmd.date = dto.date;
        cmd.type = ShiftType.fromHebrew(dto.shiftType);
        service.delete(cmd);

        return Response.ok().build();
    }

    private AddConstraintCommand toCommand(ConstraintDto dto) throws Exception {
        User user = userDao.findByUsername(dto.userId).orElse(null);
        if (user == null) throw new Exception("User not found: " + dto.userId);
        AddConstraintCommand cmd = new AddConstraintCommand();
        cmd.userId = user.id;
        cmd.date = dto.shift.date;
        cmd.type = ShiftType.fromHebrew(dto.shift.type);
        cmd.constraintType = ConstraintType.fromValue(dto.constraintType);
        return cmd;
    }
}
