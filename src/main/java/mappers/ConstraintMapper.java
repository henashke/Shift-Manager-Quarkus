package mappers;

import dto.ConstraintDto;
import dto.ShiftDto;
import entities.Constraint;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class ConstraintMapper {

    public ConstraintDto mapToDto(Constraint entity) {
        ConstraintDto dto = new ConstraintDto();
        dto.userId = entity.user.name;
        ShiftDto shiftDto = new ShiftDto();
        shiftDto.date = entity.date;
        shiftDto.type = entity.type.getHebrewRepresentation();
        dto.shift = shiftDto;
        dto.constraintType = entity.constraintType.getHebrewRepresentation();
        return dto;
    }

    public List<ConstraintDto> mapToDto(List<Constraint> entities) {
        return entities.stream().map(this::mapToDto).toList();
    }
}
