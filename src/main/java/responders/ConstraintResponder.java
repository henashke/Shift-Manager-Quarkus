package responders;

import commands.ConstraintCommand;
import commands.DeleteConstraintCommand;
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
import mappers.ConstraintMapper;
import resources.ConstraintResource;
import services.ConstraintService;

import java.util.List;

@ApplicationScoped
public class ConstraintResponder {

    @Inject
    ConstraintService constraintService;

    @Inject
    ConstraintMapper constraintMapper;

    @Inject
    UserDao userDao;

    public List<ConstraintDto> listByUser(String username, boolean isAdmin) {
        User user = userDao.findByUsername(username).orElse(null);
        if (user == null)
            throw new NotFoundException("User not found: " + username); //todo if admin give all constraints
        List<Constraint> constraints = isAdmin ? constraintService.findAll() : constraintService.findByUserId(user.id);
        return constraintMapper.mapToDto(constraints);
    }

    public List<ConstraintDto> findByUserId(Long userId) {
        return constraintMapper.mapToDto(constraintService.findByUserId(userId));
    }

    @Transactional
    public void create(ConstraintDto dto) throws Exception {
        ConstraintCommand cmd = toCommand(dto);
        constraintService.create(cmd);
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
        constraintService.delete(cmd);

        return Response.ok().build();
    }

    private ConstraintCommand toCommand(ConstraintDto dto) throws Exception {
        User user = userDao.findByUsername(dto.userId).orElse(null);
        if (user == null) throw new Exception("User not found: " + dto.userId);
        ConstraintCommand cmd = new ConstraintCommand();
        cmd.userId = user.id;
        cmd.date = dto.shift.date;
        cmd.type = ShiftType.fromHebrew(dto.shift.type);
        cmd.constraintType = ConstraintType.fromValue(dto.constraintType);
        return cmd;
    }
}
