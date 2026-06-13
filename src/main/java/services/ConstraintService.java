package services;

import commands.AddConstraintCommand;
import commands.DeleteConstraintCommand;
import commands.UpdateConstraintCommand;
import daos.BaseDao;
import daos.ConstraintDao;
import entities.Constraint;
import enums.ConstraintType;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import mappers.constraint.ConstraintCommandToEntityMapper;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@ApplicationScoped
public class ConstraintService extends BaseService<Constraint, AddConstraintCommand, UpdateConstraintCommand> {

    @Inject
    ConstraintDao dao;

    @Inject
    ConstraintCommandToEntityMapper commandToEntityMapper;

    @Override
    protected BaseDao<Constraint> getDao() {
        return dao;
    }

    @Override
    protected ConstraintCommandToEntityMapper getMapper() {
        return commandToEntityMapper;
    }

    public List<Constraint> findByUserId(Long userId) {
        return dao.findByUserId(userId);
    }

    public List<Constraint> listByWeekOffset(int weekOffset) {
        LocalDate start = windowStart(weekOffset);
        return dao.findBetween(start, start.plusWeeks(4).plusDays(6));
    }

    public List<Constraint> findByUserIdAndWeekOffset(Long userId, int weekOffset) {
        LocalDate start = windowStart(weekOffset);
        return dao.findByUserIdBetween(userId, start, start.plusWeeks(4).plusDays(6));
    }

    private LocalDate windowStart(int weekOffset) {
        return LocalDate.now()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY))
                .plusWeeks(weekOffset)
                .minusWeeks(2);
    }

    @Transactional
    public void delete(DeleteConstraintCommand command) {
        dao.deleteByUserIdDateAndType(command.userId, command.date, command.type);
    }

    public boolean hasCANTConstraint(Long userId, LocalDate date, ShiftType shiftType) {
        Constraint constraint = dao.findByUserIdAndDateAndType(userId, date, shiftType);
        return constraint != null && constraint.constraintType == ConstraintType.CANT;
    }
}
