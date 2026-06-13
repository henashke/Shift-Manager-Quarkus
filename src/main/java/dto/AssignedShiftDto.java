package dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class AssignedShiftDto extends ShiftDto {
    public String assignedUsername;
    public ShiftWeightPresetDto shiftWeightPreset;
}
