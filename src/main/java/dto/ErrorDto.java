package dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Error body the frontend expects: {"error": "..."}
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorDto {
    public String error;
}
