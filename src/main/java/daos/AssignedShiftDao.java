package daos;

import entities.AssignedShift;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDate;

@ApplicationScoped
public class AssignedShiftDao implements BaseDao<AssignedShift> {
    public void deleteBetween(LocalDate start, LocalDate end) {
        delete("date >= ?1 and date <= ?2", start, end);
    }
}
