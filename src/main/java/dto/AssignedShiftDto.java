package dto;

import entities.ShiftWeightPreset;
import enums.ShiftType;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AssignedShiftDto {
    public LocalDate date;
    public ShiftType type;
    public String assignedUsername;
    public ShiftWeightPreset shiftWeightPreset;
}
