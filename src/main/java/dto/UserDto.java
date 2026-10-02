package dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Data;

@Data
@RegisterForReflection
public class UserDto {
    public String name;
    public Integer score;
}
