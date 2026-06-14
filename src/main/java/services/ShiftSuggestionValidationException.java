package services;

import java.util.List;

/**
 * Thrown when a proposed shift schedule breaks one or more scheduling rules.
 */
public class ShiftSuggestionValidationException extends RuntimeException {

    public ShiftSuggestionValidationException(List<String> violations) {
        super("Invalid shift suggestion: " + String.join("; ", violations));
    }

}
