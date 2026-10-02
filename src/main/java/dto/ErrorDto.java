package dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Error body the frontend expects: {"error": "..."}
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@RegisterForReflection
public class ErrorDto {
    public String error;
}
