package daos;

import entities.AssignedShift;
import enums.ShiftKind;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class AssignedShiftDao implements BaseDao<AssignedShift> {
    // One table's shifts in the range (null: the regular table)
    public void deleteBetween(LocalDate start, LocalDate end, String specialTableName) {
        if (specialTableName == null) {
            delete("date >= ?1 and date <= ?2 and specialTableName is null", start, end);
        } else {
            delete("date >= ?1 and date <= ?2 and specialTableName = ?3", start, end, specialTableName);
        }
    }

    public List<AssignedShift> findBetween(LocalDate start, LocalDate end) {
        return list("date >= ?1 and date <= ?2", start, end);
    }

    public long countInTable(LocalDate start, LocalDate end, String specialTableName) {
        return count("date >= ?1 and date <= ?2 and specialTableName = ?3", start, end, specialTableName);
    }

    public int renameTable(LocalDate start, LocalDate end, String from, String to) {
        return update("specialTableName = ?1 where date >= ?2 and date <= ?3 and specialTableName = ?4", to, start, end, from);
    }

    public long deleteSlot(LocalDate date, ShiftType type, ShiftKind kind, String specialTableName) {
        if (specialTableName == null) {
            return delete("date = ?1 and type = ?2 and kind = ?3 and specialTableName is null", date, type, kind);
        }
        return delete("date = ?1 and type = ?2 and kind = ?3 and specialTableName = ?4", date, type, kind, specialTableName);
    }

    // Every role of one shift (regular, shadow, jump), in every table
    public List<AssignedShift> findByDateAndType(LocalDate date, ShiftType type) {
        return list("date = ?1 and type = ?2", date, type);
    }

}
