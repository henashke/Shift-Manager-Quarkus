package daos;

import entities.Constraint;
import enums.ShiftType;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class ConstraintDao implements PanacheRepository<Constraint> {

    public List<Constraint> findByUserId(Long userId) {
        return find("user.id", userId).list();
    }

    public List<Constraint> findByUserIdAndDate(Long userId, LocalDate date) {
        return find("user.id = ?1 and date = ?2", userId, date).list();
    }

    public Constraint findByUserIdAndDateAndType(Long userId, LocalDate date, ShiftType type) {
        return find("user.id = ?1 and date = ?2 and type = ?3", userId, date, type).firstResult();
    }

    public List<Constraint> findByDateAndType(LocalDate date, ShiftType type) {
        return find("date = ?1 and type = ?2", date, type).list();
    }

    public void deleteByUserIdAndDateAndType(Long userId, LocalDate date, ShiftType type) {
        delete("user.id = ?1 and date = ?2 and type = ?3", userId, date, type);
    }
}


