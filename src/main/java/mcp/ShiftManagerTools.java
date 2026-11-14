package mcp;

import auth.RoleConstants;
import dto.StatsDto;
import dto.mcp.*;
import enums.ConstraintType;
import enums.ShiftKind;
import enums.ShiftType;
import io.quarkiverse.mcp.server.Tool;
import io.quarkiverse.mcp.server.Tool.Annotations;
import io.quarkiverse.mcp.server.ToolArg;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import responders.McpResponder;

import java.util.List;
import java.util.Map;

/**
 * The MCP server's tools, at /mcp: what a chat app (Claude, ChatGPT, Gemini...) can do for a signed-in user. Like the
 * REST resources, each one is a one-liner and McpResponder holds the logic; permissions match the REST API (anyone reads
 * and manages their own constraints, admins also schedule). The descriptions are what the model reads to pick a tool.
 */
public class ShiftManagerTools {

    private static final String DATE = "A date in YYYY-MM-DD format.";
    private static final String WEEK = "Any date in the week, YYYY-MM-DD (weeks run Sunday to Saturday). Defaults to the current week.";
    private static final String TABLE = "The shift table: omit for the regular one. Only set it when the user names an extra table.";

    @Inject
    McpResponder responder;

    @Inject
    SecurityIdentity identity;

    @Tool(name = "whoami", description = """
            Who the signed-in user is (their name in the schedule, role and whether they're a reservist), plus today's date \
            and the current week's Sunday. Call it first when a question is about "me" or relative dates ("next week").""",
            annotations = @Annotations(title = "Who am I", readOnlyHint = true, destructiveHint = false, idempotentHint = true, openWorldHint = false))
    public McpWhoAmIDto whoami() {
        return responder.run(() -> responder.whoAmI(caller()));
    }

    @Tool(name = "get_my_shifts", description = """
            The signed-in user's own shifts in a date range (default: today through the next 13 days), in every table and \
            role. Use it for questions like "when am I on call next week?". Shifts are DAY (יום) or NIGHT (לילה); roles are \
            REGULAR (כונן), SHADOW (כונן צל) and JUMP (כונן הקפצה).""",
            annotations = @Annotations(title = "My shifts", readOnlyHint = true, destructiveHint = false, idempotentHint = true, openWorldHint = false))
    public McpMyShiftsDto get_my_shifts(
            @ToolArg(description = "First day, YYYY-MM-DD. Defaults to today.", required = false) String from,
            @ToolArg(description = "Last day (inclusive), YYYY-MM-DD. Defaults to 13 days after 'from'.", required = false) String to) {
        return responder.run(() -> responder.myShifts(caller(), from, to));
    }

    @Tool(name = "get_schedule", description = """
            The whole team's schedule for one week (Sunday to Saturday): who holds each role of each DAY/NIGHT shift, in \
            every table of the week unless one is asked for. Also lists the regular table's shifts that have no REGULAR \
            assignee yet. Use it for "who is on call on Tuesday night?" or to review a week.""",
            annotations = @Annotations(title = "Week schedule", readOnlyHint = true, destructiveHint = false, idempotentHint = true, openWorldHint = false))
    public McpScheduleDto get_schedule(
            @ToolArg(description = WEEK, required = false) String date,
            @ToolArg(description = TABLE, required = false) String table) {
        return responder.run(() -> responder.schedule(date, table));
    }

    @Tool(name = "list_users", description = """
            Everyone who can be scheduled, with their exact names (use these in other tools), role (admin or user), whether \
            they're a reservist (מילואים, only scheduled when picked) and fairness score (higher means more weighted shifts).""",
            annotations = @Annotations(title = "Users", readOnlyHint = true, destructiveHint = false, idempotentHint = true, openWorldHint = false))
    public McpUsersDto list_users() {
        return responder.run(responder::users);
    }

    @Tool(name = "get_constraints", description = """
            Availability constraints for one week: CANT (לא יכול, can't work that shift), PREFER (מעדיף) or PREFERS_NOT \
            (מעדיף שלא). Regular users only see their own; admins see everyone's unless 'person' is given.""",
            annotations = @Annotations(title = "Constraints", readOnlyHint = true, destructiveHint = false, idempotentHint = true, openWorldHint = false))
    public McpConstraintsDto get_constraints(
            @ToolArg(description = WEEK, required = false) String date,
            @ToolArg(description = "Only this person's constraints (exact name from list_users).", required = false) String person) {
        return responder.run(() -> responder.constraints(caller(), date, person));
    }

    @Tool(name = "set_constraint", description = """
            Sets the signed-in user's availability for one shift, replacing any constraint they already have on it: CANT \
            (can't work it), PREFER or PREFERS_NOT. Admins may set it for someone else with 'person'. For several shifts, \
            call it once per shift.""",
            annotations = @Annotations(title = "Set constraint", readOnlyHint = false, destructiveHint = false, idempotentHint = true, openWorldHint = false))
    public String set_constraint(
            @ToolArg(description = DATE) String date,
            @ToolArg(description = "DAY or NIGHT.") ShiftType shift,
            @ToolArg(description = "CANT, PREFER or PREFERS_NOT.") ConstraintType constraint,
            @ToolArg(description = "Admins only: whose constraint (exact name). Defaults to the signed-in user.", required = false) String person) {
        return responder.run(() -> responder.setConstraint(caller(), date, shift, constraint, person));
    }

    @Tool(name = "remove_constraint", description = """
            Removes the signed-in user's constraint on one shift, making them plainly available. Admins may remove someone \
            else's with 'person'.""",
            annotations = @Annotations(title = "Remove constraint", readOnlyHint = false, destructiveHint = true, idempotentHint = true, openWorldHint = false))
    public String remove_constraint(
            @ToolArg(description = DATE) String date,
            @ToolArg(description = "DAY or NIGHT.") ShiftType shift,
            @ToolArg(description = "Admins only: whose constraint (exact name). Defaults to the signed-in user.", required = false) String person) {
        return responder.run(() -> responder.removeConstraint(caller(), date, shift, person));
    }

    @Tool(name = "get_stats", description = """
            Shift statistics per person, counting shifts done up to today: this year, all time, the last 30 days, day vs. \
            night, weekends, and shadow/jump roles separately.""",
            annotations = @Annotations(title = "Statistics", readOnlyHint = true, destructiveHint = false, idempotentHint = true, openWorldHint = false))
    public StatsDto get_stats() {
        return responder.run(responder::stats);
    }

    @Tool(name = "get_weight_presets", description = """
            The fairness weights: how much each shift (day of week + DAY/NIGHT) adds to a person's score, in the current \
            preset and all saved ones. Use it to explain scores or why a suggestion picked someone.""",
            annotations = @Annotations(title = "Weight presets", readOnlyHint = true, destructiveHint = false, idempotentHint = true, openWorldHint = false))
    public Map<String, Object> get_weight_presets() {
        return responder.run(responder::weightPresets);
    }

    // Admin tools

    @Tool(name = "suggest_schedule", description = """
            Admins only. Proposes REGULAR assignments for one week, balancing fairness scores and respecting constraints. \
            Nothing is saved: show the proposal to the user and, once they approve, save it with assign_shifts.""",
            annotations = @Annotations(title = "Suggest a week", readOnlyHint = true, destructiveHint = false, idempotentHint = false, openWorldHint = false))
    public McpShiftsDto suggest_schedule(
            @ToolArg(description = "Any date in the week to fill, YYYY-MM-DD.") String weekStart,
            @ToolArg(description = "Who to schedule (exact names). Defaults to everyone except reservists.", required = false) List<String> people,
            @ToolArg(description = TABLE, required = false) String table) {
        return responder.run(() -> responder.suggest(caller(), weekStart, people, table));
    }

    @Tool(name = "assign_shifts", description = """
            Admins only. Saves assignments, replacing whoever held each role before. All or nothing: nothing is saved if \
            anyone has a CANT constraint on their shift or would hold two roles of the same shift. Confirm with the user \
            before saving changes they didn't spell out.""",
            annotations = @Annotations(title = "Assign shifts", readOnlyHint = false, destructiveHint = true, idempotentHint = true, openWorldHint = false))
    public McpShiftsDto assign_shifts(
            @ToolArg(description = "The assignments: date (YYYY-MM-DD), shift (DAY/NIGHT), person (exact name) and role (REGULAR when omitted, SHADOW or JUMP).") List<McpAssignmentInput> assignments,
            @ToolArg(description = TABLE, required = false) String table) {
        return responder.run(() -> responder.assign(caller(), assignments, table));
    }

    @Tool(name = "unassign_shift", description = "Admins only. Removes whoever holds one role of one shift.",
            annotations = @Annotations(title = "Unassign a shift", readOnlyHint = false, destructiveHint = true, idempotentHint = true, openWorldHint = false))
    public String unassign_shift(
            @ToolArg(description = DATE) String date,
            @ToolArg(description = "DAY or NIGHT.") ShiftType shift,
            @ToolArg(description = "REGULAR (default), SHADOW or JUMP.", required = false) ShiftKind role,
            @ToolArg(description = TABLE, required = false) String table) {
        return responder.run(() -> responder.unassign(caller(), date, shift, role, table));
    }

    @Tool(name = "clear_week", description = """
            Admins only. Deletes every assignment of one table for a whole week. Always confirm with the user first.""",
            annotations = @Annotations(title = "Clear a week", readOnlyHint = false, destructiveHint = true, idempotentHint = true, openWorldHint = false))
    public String clear_week(
            @ToolArg(description = "Any date in the week, YYYY-MM-DD.") String date,
            @ToolArg(description = TABLE, required = false) String table) {
        return responder.run(() -> responder.clearWeek(caller(), date, table));
    }

    @Tool(name = "rename_table", description = "Admins only. Renames one of a week's extra tables (not the regular one).",
            annotations = @Annotations(title = "Rename a table", readOnlyHint = false, destructiveHint = false, idempotentHint = true, openWorldHint = false))
    public String rename_table(
            @ToolArg(description = "Any date in the week, YYYY-MM-DD.") String date,
            @ToolArg(description = "The table's current name.") String from,
            @ToolArg(description = "The new name (up to 50 characters).") String to) {
        return responder.run(() -> responder.renameTable(caller(), date, from, to));
    }

    @Tool(name = "recalculate_scores", description = "Admins only. Recomputes everyone's fairness score from all their shifts.",
            annotations = @Annotations(title = "Recalculate scores", readOnlyHint = false, destructiveHint = false, idempotentHint = true, openWorldHint = false))
    public String recalculate_scores() {
        return responder.run(() -> responder.recalculateScores(caller()));
    }

    private McpCaller caller() {
        return new McpCaller(identity.getPrincipal().getName(), identity.hasRole(RoleConstants.ADMIN));
    }
}
