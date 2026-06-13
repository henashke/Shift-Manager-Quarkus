package responders;

import commands.AddConstraintCommand;
import commands.DeleteConstraintCommand;
import commands.UpdateConstraintCommand;
import daos.UserDao;
import dto.ConstraintDto;
import dto.DeleteConstraintDto;
import entities.Constraint;
import entities.User;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import mappers.DtoToCommandMapper;
import mappers.constraint.ConstraintDtoToCommandMapper;
import services.BaseService;
import services.ConstraintService;

import java.util.List;

@ApplicationScoped
public class ConstraintResponder extends BaseResponder<Constraint, AddConstraintCommand, UpdateConstraintCommand, ConstraintDto> {

    @Inject
    ConstraintService constraintService;

    @Inject
    ConstraintDtoToCommandMapper constraintDtoToCommandMapper;

    @Inject
    UserDao userDao;

    @Override
    protected BaseService<Constraint, AddConstraintCommand, UpdateConstraintCommand> getService() {
        return constraintService;
    }

    @Override
    protected DtoToCommandMapper<ConstraintDto, Constraint, AddConstraintCommand, UpdateConstraintCommand> getDtoToCommandMapper() {
        return constraintDtoToCommandMapper;
    }

    public List<ConstraintDto> listByUser(String username, boolean isAdmin) {
        User user = userDao.findByUsername(username).orElse(null);
        if (user == null) throw new NotFoundException("User not found: " + username);
        List<Constraint> constraints = isAdmin ? constraintService.listAll() : constraintService.findByUserId(user.id);
        return constraintDtoToCommandMapper.mapToDto(constraints);
    }

    public List<ConstraintDto> findByUserId(Long userId) {
        return constraintDtoToCommandMapper.mapToDto(constraintService.findByUserId(userId));
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
}