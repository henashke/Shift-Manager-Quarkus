package services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import entities.AssignedShift;
import entities.Constraint;
import entities.User;
import enums.Day;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds the natural-language prompt sent to an LLM and parses the JSON it returns back into
 * {@link AssignedShift} entities. Shared by every {@link ShiftSuggester} so the prompt and the
 * expected JSON contract stay identical across providers.
 */
@ApplicationScoped
public class ShiftSuggestionPromptBuilder {

    @Inject
    ObjectMapper mapper;

    /**
     * Human-readable instructions describing the task and the exact JSON schema to return.
     */
    public String buildPrompt(List<User> users,
                              List<Constraint> constraints,
                              LocalDate startDate,
                              LocalDate endDate) {
        int days = (int) ChronoUnit.DAYS.between(startDate, endDate) + 1;
        int totalShifts = days * 2;
        int employeeCount = users.size();
        int minPerEmployee = totalShifts / employeeCount;
        int maxPerEmployee = (totalShifts % employeeCount == 0) ? minPerEmployee : minPerEmployee + 1;

        StringBuilder sb = new StringBuilder();
        sb.append("You are a shift scheduling assistant for a team of employees.\n");
        sb.append("Your job is to assign employees to work shifts, sharing the load as evenly as possible.\n\n");

        sb.append("RULES (in priority order):\n");
        sb.append("1. Each date in the range needs EXACTLY ONE \"DAY\" shift and EXACTLY ONE \"NIGHT\" shift.\n");
        sb.append("2. NEVER assign an employee to a shift they have a \"CANT\" constraint for.\n");
        sb.append("3. Do not assign the same employee to both the DAY and NIGHT shift on the same date.\n");
        sb.append("4. SHARE THE LOAD AS EVENLY AS POSSIBLE. There are ")
                .append(totalShifts).append(" shifts to fill (").append(days).append(" days x 2) for ")
                .append(employeeCount).append(" employees, so an equal share would be roughly ")
                .append(minPerEmployee).append("-").append(maxPerEmployee).append(" shifts each. ");
        sb.append("Treat this as a GOAL, not a hard rule: an employee who is unavailable on many days ")
                .append("(has more CANT constraints) will naturally get fewer shifts, and that is expected and fine. ");
        sb.append("The real aim is to avoid overloading one employee while other AVAILABLE employees get ")
                .append("noticeably fewer. Give every employee a share of shifts WHEN THEIR AVAILABILITY ALLOWS; ")
                .append("never break rule 2 just to hit a target count.\n");
        sb.append("5. As a tie-breaker only, when choosing between employees who are otherwise equal, ");
        sb.append("prefer the one with the LOWER current score (to even out cumulative scores over time).\n\n");

        sb.append("DATE RANGE (inclusive, format yyyy-MM-dd): ")
                .append(startDate).append(" to ").append(endDate).append("\n\n");

        sb.append("EMPLOYEES (username : current score):\n");
        for (User user : users) {
            sb.append("- ").append(user.name)
                    .append(" : ").append(user.score == null ? 0 : user.score)
                    .append("\n");
        }
        sb.append("\n");

        sb.append("CONSTRAINTS (employee, date, shift, type):\n");
        if (constraints.isEmpty()) {
            sb.append("(none)\n");
        } else {
            for (Constraint constraint : constraints) {
                String name = constraint.user != null ? constraint.user.name : "?";
                sb.append("- ").append(name)
                        .append(", ").append(constraint.date)
                        .append(", ").append(constraint.type)
                        .append(" : ").append(constraint.constraintType)
                        .append(" (").append(Day.fromDate(constraint.date)).append(")")
                        .append("\n");
            }
        }
        sb.append("\n");

        sb.append("OUTPUT FORMAT:\n");
        sb.append("Respond with ONLY a single valid JSON object. No markdown, no code fences, no explanation.\n");
        sb.append("The JSON MUST match this exact schema:\n");
        sb.append("{\n");
        sb.append("  \"assignments\": [\n");
        sb.append("    { \"username\": \"<employee username>\", \"date\": \"<yyyy-MM-dd>\", \"shiftType\": \"DAY\" }\n");
        sb.append("  ]\n");
        sb.append("}\n");
        sb.append("Constraints on the output:\n");
        sb.append("- \"username\" MUST be one of the employee usernames listed above (exact spelling).\n");
        sb.append("- \"shiftType\" MUST be exactly \"DAY\" or \"NIGHT\".\n");
        sb.append("- \"date\" MUST be within the date range above, in yyyy-MM-dd format.\n");
        sb.append("- Provide exactly two assignments per date (one DAY and one NIGHT).\n");

        return sb.toString();
    }

    /**
     * Parses the model's JSON text (an object with an {@code assignments} array) into entities.
     *
     * @throws Exception if the JSON is malformed, incomplete, or references an unknown user
     */
    public List<AssignedShift> parseAssignments(String modelJson, List<User> users) throws Exception {
        Map<String, User> usersByName = new HashMap<>();
        for (User user : users) {
            usersByName.put(user.name.toLowerCase(), user);
        }

        JsonNode root = mapper.readTree(modelJson);
        JsonNode assignmentsNode = root.path("assignments");
        if (!assignmentsNode.isArray()) {
            throw new IllegalStateException(
                    "Model response did not contain an 'assignments' array: " + modelJson);
        }

        List<AssignedShift> suggestions = new ArrayList<>();
        for (JsonNode node : assignmentsNode) {
            String username = node.path("username").asText(null);
            String dateText = node.path("date").asText(null);
            String typeText = node.path("shiftType").asText(null);

            if (username == null || dateText == null || typeText == null) {
                throw new IllegalStateException("Incomplete assignment from model: " + node);
            }

            User user = usersByName.get(username.toLowerCase());
            if (user == null) {
                throw new IllegalStateException("Model assigned an unknown user: " + username);
            }

            AssignedShift shift = new AssignedShift();
            shift.assignedUser = user;
            shift.date = LocalDate.parse(dateText.trim());
            shift.type = ShiftType.valueOf(typeText.trim().toUpperCase());
            suggestions.add(shift);
        }

        if (suggestions.isEmpty()) {
            throw new IllegalStateException("Model returned no assignments");
        }
        return suggestions;
    }
}
