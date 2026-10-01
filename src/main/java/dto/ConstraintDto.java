package dto;

import lombok.Data;

@Data
public class ConstraintDto {
    public String userId;
    public ShiftDto shift;
    public String constraintType;
}
