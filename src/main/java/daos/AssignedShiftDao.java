package daos;

import entities.AssignedShift;
import enums.ShiftKind;
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

    public long deleteSlot(LocalDate date, ShiftType type, ShiftKind kind) {
        return delete("date = ?1 and type = ?2 and kind = ?3", date, type, kind);
    }

    // Every role of one shift (regular, shadow, jump)
    public List<AssignedShift> findByDateAndType(LocalDate date, ShiftType type) {
        return list("date = ?1 and type = ?2", date, type);
    }

    public List<AssignedShift> findBetweenOfKinds(LocalDate start, LocalDate end, List<ShiftKind> kinds) {
        return list("date >= ?1 and date <= ?2 and kind in ?3", start, end, kinds);
    }
}
