package services;

import entities.AssignedShift;
import entities.Constraint;
import entities.User;
import enums.ConstraintType;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Validates a proposed set of {@link AssignedShift}s (from the LLM or the offline algorithm)
 * against the scheduling rules. Throws {@link ShiftSuggestionValidationException} listing every
 * problem found, so the caller can reject a bad suggestion and fall back.
 */
@ApplicationScoped
public class ShiftSuggestionValidator {

    private static final ShiftType[] SHIFT_TYPES = {ShiftType.DAY, ShiftType.NIGHT};

    public void validate(List<AssignedShift> shifts,
                         List<User> users,
                         List<Constraint> constraints,
                         LocalDate startDate,
                         LocalDate endDate) {
        List<String> violations = new ArrayList<>();

        Set<Long> allowedUserIds = new HashSet<>();
        for (User user : users) {
            allowedUserIds.add(user.id);
        }

        // (userId|date|type) tuples the user CANNOT work.
        Set<String> cantKeys = new HashSet<>();
        for (Constraint constraint : constraints) {
            if (constraint.constraintType == ConstraintType.CANT && constraint.user != null) {
                cantKeys.add(cantKey(constraint.user.id, constraint.date, constraint.type));
            }
        }

        Set<String> filledSlots = new HashSet<>();      // date|type -> detect duplicate slot fills
        Set<String> userDayAssignments = new HashSet<>(); // date|userId -> detect same user twice a day

        for (AssignedShift shift : shifts) {
            if (shift.assignedUser == null) {
                violations.add("Assignment on " + shift.date + " " + shift.type + " has no user");
                continue;
            }
            Long userId = shift.assignedUser.id;
            String who = shift.assignedUser.name;

            if (!allowedUserIds.contains(userId)) {
                violations.add("User '" + who + "' was not among the requested users");
            }

            if (shift.date == null || shift.date.isBefore(startDate) || shift.date.isAfter(endDate)) {
                violations.add("Assignment for '" + who + "' on " + shift.date + " is outside the range "
                        + startDate + ".." + endDate);
                continue;
            }

            if (cantKeys.contains(cantKey(userId, shift.date, shift.type))) {
                violations.add("User '" + who + "' assigned to " + shift.date + " " + shift.type
                        + " but has a CANT constraint there");
            }

            String slotKey = shift.date + "|" + shift.type;
            if (!filledSlots.add(slotKey)) {
                violations.add("Duplicate assignment for slot " + shift.date + " " + shift.type);
            }

            String userDayKey = shift.date + "|" + userId;
            if (!userDayAssignments.add(userDayKey)) {
                violations.add("User '" + who + "' assigned to both shifts on " + shift.date);
            }
        }

        // Every date in the range must have exactly one DAY and one NIGHT shift.
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            for (ShiftType type : SHIFT_TYPES) {
                if (!filledSlots.contains(date + "|" + type)) {
                    violations.add("Missing assignment for " + date + " " + type);
                }
            }
        }

        if (!violations.isEmpty()) {
            throw new ShiftSuggestionValidationException(violations);
        }
    }

    private String cantKey(Long userId, LocalDate date, ShiftType type) {
        return userId + "|" + date + "|" + type;
    }
}
