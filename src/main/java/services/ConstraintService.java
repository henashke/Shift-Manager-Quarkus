package services;

import commands.ConstraintCommand;
import commands.DeleteConstraintCommand;
import daos.ConstraintDao;
import daos.UserDao;
import entities.Constraint;
import entities.User;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class ConstraintService {

    @Inject
    ConstraintDao constraintDao;

    @Inject
    UserDao userDao;

    public List<Constraint> findByUserId(Long userId) {
        return constraintDao.findByUserId(userId);
    }

    public Constraint create(ConstraintCommand command) throws Exception {
        User user = userDao.findById(command.userId);
        if (user == null) {
            throw new Exception("User not found");
        }

        // Check if constraint already exists
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

    public void delete(DeleteConstraintCommand command) throws Exception {
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

    public Constraint findById(Long id) {
        return constraintDao.findById(id);
    }

    public void deleteById(Long id) {
        constraintDao.deleteById(id);
    }
}


