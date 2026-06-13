package dto;

import enums.Day;
import enums.ShiftType;
import lombok.Data;

@Data
public class ShiftWeightDto {
    public Day day;
    public ShiftType shiftType;
    public int weight;
}
