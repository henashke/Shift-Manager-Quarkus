package services;

import commands.AddShiftCommand;
import commands.UpdateShiftCommand;
import daos.AssignedShiftDao;
import daos.BaseDao;
import entities.AssignedShift;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import mappers.AssignedShiftMapper;
import mappers.CommandToEntityMapper;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class ShiftService extends BaseService<AssignedShift, AddShiftCommand, UpdateShiftCommand> {

    @Inject
    AssignedShiftDao assignedShiftDao;

    @Inject
    AssignedShiftMapper assignedShiftMapper;

    @Override
    protected BaseDao<AssignedShift> getDao() {
        return assignedShiftDao;
    }

    @Override
    protected CommandToEntityMapper<AssignedShift, AddShiftCommand, UpdateShiftCommand> getMapper() {
        return assignedShiftMapper;
    }

    @Transactional
    public void deleteShiftsForWeek(LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        assignedShiftDao.delete("date >= ?1 and date <= ?2", weekStart, weekEnd);
    }

    public List<AssignedShift> getAllShiftsBetween(LocalDate startDate, LocalDate endDate) {
        return assignedShiftDao.find("date >= ?1 and date <= ?2", startDate, endDate).list();
    }
}
