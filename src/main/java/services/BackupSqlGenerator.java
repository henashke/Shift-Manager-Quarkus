package services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import enums.ConstraintType;
import enums.ShiftType;

import java.io.InputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Utility to generate SQL insert statements from an existing backup directory
 * in resources/backups/<backupName>.
 *
 * Usage example:
 * new BackupSqlGenerator().generateSqlFromBackupDir("example1", Path.of("out.sql"));
 */
public class BackupSqlGenerator {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Read the backup JSON files from the resources/backups/<backupDir> (or from
     * src/main/resources/backups/<backupDir> when running from the project) and
     * generate a single .sql file with inserts for users, constraints and assigned_shifts.
     *
     * The output SQL file is written to: src/main/resources/backup/results/{backupDirName}/backup.sql
     */
    public void generateSqlFromBackupDir(String backupDirName) throws IOException {
        List<Map<String, Object>> users = readJsonArray(backupDirName, "users.json");
        List<Map<String, Object>> constraints = readJsonArray(backupDirName, "constraints.json");
        List<Map<String, Object>> shifts = readJsonArray(backupDirName, "shifts.json");

        StringBuilder sb = new StringBuilder();
        sb.append("-- Generated SQL from backup ").append(backupDirName).append("\n");
        sb.append("BEGIN;\n\n");

        // users first
        sb.append(generateUsersInserts(users)).append("\n\n");

        // constraints
        sb.append(generateConstraintsInserts(constraints)).append("\n\n");

        // assigned_shifts
        sb.append(generateAssignedShiftsInserts(shifts)).append("\n\n");

        sb.append("COMMIT;\n");

        Path outPath = Path.of("src", "main", "resources", "backup", "results", backupDirName, "backup.sql");
        Files.createDirectories(outPath.getParent());
        Files.write(outPath, sb.toString().getBytes(StandardCharsets.UTF_8));
    }

    // --- per-table generators ---

    public String generateUsersInserts(List<Map<String, Object>> users) {
        StringBuilder sb = new StringBuilder();
        sb.append("-- users inserts\n");
        for (Map<String, Object> u : users) {
            String name = asString(u.get("name"));
            String password = asString(u.get("password"));
            String score = u.get("score") == null ? "NULL" : u.get("score").toString();
            String role = asString(u.get("role"));

            sb.append("INSERT INTO users (name, password, score, role) VALUES (")
              .append(sqlString(name)).append(", ")
              .append(sqlString(password)).append(", ")
              .append(score).append(", ")
              .append(sqlString(role)).append(");\n");
        }
        return sb.toString();
    }

    public String generateConstraintsInserts(List<Map<String, Object>> constraints) {
        StringBuilder sb = new StringBuilder();
        sb.append("-- constraints inserts\n");

        for (Map<String, Object> c : constraints) {
            // backup format: { "shift": { "date": <millis>, "type": "..." }, "constraintType": "...", "userId": "username" }
            Map<String, Object> shift = (Map<String, Object>) c.get("shift");
            long dateMillis = shift.get("date") == null ? 0L : ((Number) shift.get("date")).longValue();
            String dateStr = epochMillisToDate(dateMillis);
            String shiftType = ShiftType.fromHebrew(asString(shift.get("type"))).name();
            String constraintTypeHebrew = asString(c.get("constraintType"));
            String constraintType = ConstraintType.fromValue(constraintTypeHebrew).name();
            String userName = asString(c.get("userId"));

            sb.append("INSERT INTO constraints (user_id, shift_date, shift_type, constraint_type) VALUES (")
              .append("(SELECT id FROM users WHERE name = ").append(sqlString(userName)).append("), ")
              .append(sqlString(dateStr)).append(", ")
              .append(sqlString(shiftType)).append(", ")
              .append(sqlString(constraintType)).append(");\n");
        }

        return sb.toString();
    }

    public String generateAssignedShiftsInserts(List<Map<String, Object>> shifts) {
        StringBuilder sb = new StringBuilder();
        sb.append("-- assigned_shifts inserts\n");

        for (Map<String, Object> s : shifts) {
            long dateMillis = s.get("date") == null ? 0L : ((Number) s.get("date")).longValue();
            String dateStr = epochMillisToDate(dateMillis);
            String type = ShiftType.fromHebrew(asString(s.get("type"))).name();
            String assignedUsername = asString(s.get("assignedUsername"));

            // preset handling omitted - set preset_id to NULL. If you want to map by preset name,
            // another pass would be needed.
            sb.append("INSERT INTO assigned_shifts (user_id, shift_date, shift_type, preset_id) VALUES (")
              .append("(SELECT id FROM users WHERE name = ").append(sqlString(assignedUsername)).append("), ")
              .append(sqlString(dateStr)).append(", ")
              .append(sqlString(type)).append(", NULL);");
            sb.append("\n");
        }

        return sb.toString();
    }

    // --- helpers ---

    private List<Map<String, Object>> readJsonArray(String backupDirName, String filename) throws IOException {
        String resourcePath = "backups/" + backupDirName + "/" + filename;
        InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(resourcePath);
        if (is == null) {
            // fallback to project resources path when running from IDE
            Path p = Path.of("src", "main", "resources", "backups", backupDirName, filename);
            if (!Files.exists(p)) {
                return new ArrayList<>();
            }
            byte[] bytes = Files.readAllBytes(p);
            return objectMapper.readValue(bytes, new TypeReference<List<Map<String, Object>>>(){});
        }
        try (InputStream eis = is) {
            return objectMapper.readValue(eis, new TypeReference<List<Map<String, Object>>>(){});
        }
    }

    private String epochMillisToDate(long epochMillis) {
        if (epochMillis <= 0) return null;
        LocalDate d = Instant.ofEpochMilli(epochMillis).atZone(ZoneId.systemDefault()).toLocalDate();
        return d.format(DATE_FMT);
    }

    private String sqlString(String s) {
        if (s == null) return "NULL";
        return "'" + escapeSql(s) + "'";
    }

    private String escapeSql(String s) {
        return s.replace("'", "''");
    }

    private String asString(Object o) {
        return o == null ? null : o.toString();
    }

}

