package services;

import commands.ConstraintCommand;
import commands.DeleteConstraintCommand;
import daos.ConstraintDao;
import daos.UserDao;
import dto.ConstraintDto;
import entities.Constraint;
import entities.User;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import mappers.ConstraintMapper;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class ConstraintService {

    @Inject
    ConstraintDao constraintDao;

    @Inject
    UserDao userDao;

    @Inject
    ConstraintMapper constraintMapper;

    public List<ConstraintDto> findAllDto() {
        return constraintMapper.mapToDto(findAll());
    }

    public List<ConstraintDto> findByUserIdDto(Long userId) {
        return constraintMapper.mapToDto(constraintDao.findByUserId(userId));
    }

    public Constraint create(ConstraintCommand command) throws Exception {
        User user = userDao.findById(command.userId);
        if (user == null) {
            throw new Exception("User not found");
        }

        Constraint existing = constraintDao.findByUserIdAndDateAndType(
                command.userId, command.date, command.type);
        if (existing != null) {
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

    public void delete(DeleteConstraintCommand command) {
        constraintDao.deleteByUserIdAndDateAndType(
                command.userId, command.date, command.type);
    }

    public boolean hasCANTConstraint(Long userId, LocalDate date, ShiftType shiftType) {
        Constraint constraint = constraintDao.findByUserIdAndDateAndType(userId, date, shiftType);
        return constraint != null && constraint.constraintType.getValue().equals("CANT");
    }

    public List<Constraint> findAll() {
        return constraintDao.listAll();
    }
}