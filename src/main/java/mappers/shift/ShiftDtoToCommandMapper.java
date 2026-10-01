package mappers.shift;

import commands.AddShiftCommand;
import commands.UpdateShiftCommand;
import daos.ShiftWeightPresetDao;
import daos.UserDao;
import dto.AssignedShiftDto;
import entities.AssignedShift;
import entities.ShiftWeightPreset;
import entities.User;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import mappers.DtoToCommandMapper;
import mappers.shiftWeightPreset.ShiftWeightPresetDtoToCommandMapper;

@ApplicationScoped
public class ShiftDtoToCommandMapper implements DtoToCommandMapper<AssignedShiftDto, AssignedShift, AddShiftCommand, UpdateShiftCommand> {

    @Inject
    UserDao userDao;

    @Inject
    ShiftWeightPresetDao shiftWeightPresetDao;

    @Inject
    ShiftWeightPresetDtoToCommandMapper shiftWeightPresetDtoToCommandMapper;

    @Override
    public AddShiftCommand mapToAddCommand(AssignedShiftDto dto) {
        User user = userDao.findByUsername(dto.assignedUsername)
                .orElseThrow(() -> new BadRequestException("User not found: " + dto.assignedUsername));
        ShiftWeightPreset preset = dto.preset != null
                ? shiftWeightPresetDao.findByName(dto.preset.name) : null;

        AddShiftCommand cmd = new AddShiftCommand();
        cmd.date = dto.date;
        cmd.type = ShiftType.fromHebrew(dto.type);
        cmd.userId = user.id;
        cmd.shiftWeightPresetId = preset != null ? preset.id : null;
        return cmd;
    }

    @Override
    public UpdateShiftCommand mapToUpdateCommand(AssignedShiftDto dto) {
        UpdateShiftCommand cmd = new UpdateShiftCommand();
        cmd.userId = dto.assignedUsername != null
                ? userDao.findByUsername(dto.assignedUsername).map(u -> u.id).orElse(null) : null;
        cmd.shiftWeightPresetId = dto.preset != null
                ? shiftWeightPresetDao.findByName(dto.preset.name) != null
                  ? shiftWeightPresetDao.findByName(dto.preset.name).id : null
                : null;
        return cmd;
    }

    @Override
    public AssignedShiftDto mapToDto(AssignedShift entity) {
        AssignedShiftDto dto = new AssignedShiftDto();
        dto.date = entity.date;
        dto.type = entity.type.getHebrewRepresentation();
        dto.assignedUsername = entity.assignedUser != null ? entity.assignedUser.name : null;
        dto.preset = entity.shiftWeightPreset != null
                ? shiftWeightPresetDtoToCommandMapper.mapToDto(entity.shiftWeightPreset) : null;
        return dto;
    }
}
