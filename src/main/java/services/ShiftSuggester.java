package services;

import entities.AssignedShift;
import entities.Constraint;
import entities.User;

import java.time.LocalDate;
import java.util.List;

/**
 * A strategy that proposes shift assignments for a set of users over a date range,
 * typically by delegating to an LLM. Implementations are selected at runtime via the
 * {@code suggestion.provider} config property.
 */
public interface ShiftSuggester {

    /**
     * Short provider key (e.g. "ollama", "gemini") matched against {@code suggestion.provider}.
     */
    String name();

    /**
     * Whether this provider is configured and should be attempted.
     */
    boolean isEnabled();

    /**
     * Produces one {@link AssignedShift} per assignment the model returns.
     *
     * @throws Exception if the model is unreachable or its response is not usable
     */
    List<AssignedShift> suggest(List<User> users,
                                List<Constraint> constraints,
                                LocalDate startDate,
                                LocalDate endDate) throws Exception;
}
