package commands;

import entities.AssignedShift;

public class UpdateShiftCommand extends UpdateCommand<AssignedShift> {
    public Long userId;
    public Long shiftWeightPresetId;
}
