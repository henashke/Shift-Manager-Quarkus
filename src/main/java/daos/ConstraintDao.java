package daos;

import entities.Constraint;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class ConstraintDao implements BaseDao<Constraint> {

    public List<Constraint> findByUserId(Long userId) {
        return find("user.id", userId).list();
    }

    public Constraint findByUserIdAndDateAndType(Long userId, LocalDate date, ShiftType type) {
        return find("user.id = ?1 and date = ?2 and type = ?3", userId, date, type).firstResult();
    }

    public void deleteByUserIdAndDateAndType(Long userId, LocalDate date, ShiftType type) {
        delete("user.id = ?1 and date = ?2 and type = ?3", userId, date, type);
    }
}


