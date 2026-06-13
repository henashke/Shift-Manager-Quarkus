package dto;

import enums.ConstraintType;
import lombok.Data;

@Data
public class ConstraintDto {
    public String userId;
    public ShiftDto shift;
    public ConstraintType constraintType;
}
