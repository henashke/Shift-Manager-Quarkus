package dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Data;

@Data
@RegisterForReflection
public class ConstraintDto {
    public String userId;
    public ShiftDto shift;
    public String constraintType;
}
