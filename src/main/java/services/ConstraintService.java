package services;

import commands.AddConstraintCommand;
import commands.DeleteConstraintCommand;
import daos.BaseDao;
import daos.ConstraintDao;
import daos.UserDao;
import entities.Constraint;
import entities.User;
import enums.ConstraintType;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import mappers.CommandToEntityMapper;
import mappers.ConstraintMapper;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class ConstraintService extends BaseService<Constraint, AddConstraintCommand> {

    @Inject
    ConstraintDao constraintDao;

    @Inject
    UserDao userDao;

    @Inject
    ConstraintMapper constraintMapper;

    @Override
    protected BaseDao<Constraint> getDao() {
        return constraintDao;
    }

    @Override
    protected CommandToEntityMapper<Constraint, AddConstraintCommand, ?, ?> getMapper() {
        return constraintMapper;
    }

    public List<Constraint> findAll() {
        return constraintDao.listAll();
    }

    public List<Constraint> findByUserId(Long userId) {
        return constraintDao.findByUserId(userId);
    }

    @Transactional
    public Constraint create(AddConstraintCommand command) throws Exception {
        User user = userDao.findById(command.userId);
        if (user == null) throw new Exception("User not found");

        Constraint existing = constraintDao.findByUserIdAndDateAndType(command.userId, command.date, command.type);
        if (existing != null) {
            existing.constraintType = command.constraintType;
            return existing;
        }

        Constraint constraint = new Constraint();
        constraint.user = user;
        constraint.date = command.date;
        constraint.type = command.type;
        constraint.constraintType = command.constraintType;
        constraintDao.persist(constraint);
        return constraint;
    }

    @Transactional
    public void delete(DeleteConstraintCommand command) {
        constraintDao.deleteByUserIdAndDateAndType(command.userId, command.date, command.type);
    }

    public boolean hasCANTConstraint(Long userId, LocalDate date, ShiftType shiftType) {
        Constraint constraint = constraintDao.findByUserIdAndDateAndType(userId, date, shiftType);
        return constraint != null && constraint.constraintType == ConstraintType.CANT;
    }
}
