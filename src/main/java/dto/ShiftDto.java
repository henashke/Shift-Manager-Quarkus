package dto;

import enums.ShiftType;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ShiftDto {
    public LocalDate date;
    public ShiftType type;
}
