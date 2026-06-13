package daos;

import entities.AssignedShift;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class AssignedShiftDao implements BaseDao<AssignedShift> {
    public void deleteBetween(LocalDate start, LocalDate end) {
        delete("date >= ?1 and date <= ?2", start, end);
    }

    public List<AssignedShift> findBetween(LocalDate start, LocalDate end) {
        return list("date >= ?1 and date <= ?2", start, end);
    }

    public void deleteByDateAndType(LocalDate date, ShiftType type) {
        delete("date = ?1 and type = ?2", date, type);
    }
}
