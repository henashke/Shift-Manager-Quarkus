package services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import enums.ConstraintType;
import enums.Day;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Utility to generate SQL insert statements from an existing backup directory
 * in resources/backup/<backupName>.
 * <p>
 * Usage example:
 * new BackupSqlGenerator().generateSqlFromBackupDir("example1", Path.of("out.sql"));
 */
@ApplicationScoped
public class BackupSqlGenerator {

    private final Map<String, Long> usernameToIdMap = new HashMap<>();
    private final Map<String, Long> presetNameToIdMap = new HashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Read the backup JSON files from the resources/backup/<backupDir> (or from
     * src/main/resources/backup/<backupDir> when running from the project) and
     * generate a single .sql file with inserts for users, constraints, and assigned_shifts.
     * <p>
     * The output SQL file is written to: src/main/resources/backup/results/{backupDirName}/backup.sql
     */
    public void generateSqlFromBackupDir(String backupDirName) throws IOException {
        List<Map<String, Object>> users = readJsonArray(backupDirName, "users.json");
        List<Map<String, Object>> constraints = readJsonArray(backupDirName, "constraints.json");
        List<Map<String, Object>> shifts = readJsonArray(backupDirName, "shifts.json");

        String sb = "-- Generated SQL from backup " + backupDirName + "\n" +
                "BEGIN;\n\n" +

                // users first
                generateUsersInserts(users) + "\n\n" +

                // presets and weights
                generatePresetsAndWeightsInserts(backupDirName) + "\n\n" +

                // constraints
                generateConstraintsInserts(constraints) + "\n\n" +

                // assigned_shifts
                generateAssignedShiftsInserts(shifts) + "\n\n" +
                "COMMIT;\n";

        Path outPath = Path.of("src", "main", "resources", "backup", "results", backupDirName, "backup.sql");
        Files.createDirectories(outPath.getParent());
        Files.writeString(outPath, sb);
    }

    // --- per-table generators ---

    public String generateUsersInserts(List<Map<String, Object>> users) {
        usernameToIdMap.clear();
        StringBuilder sb = new StringBuilder();
        sb.append("-- users inserts\n");
        long currentId = 1;
        for (Map<String, Object> u : users) {
            String name = asString(u.get("name"));
            String password = asString(u.get("password"));
            String score = u.get("score") == null ? "NULL" : u.get("score").toString();
            String role = asString(u.get("role"));

            usernameToIdMap.put(name, currentId);

            sb.append("INSERT INTO users (id, name, password, score, role) VALUES (")
                    .append(currentId).append(", ")
                    .append(sqlString(name)).append(", ")
                    .append(sqlString(password)).append(", ")
                    .append(score).append(", ")
                    .append(sqlString(role)).append(");\n");
            currentId++;
        }
        sb.append("ALTER TABLE users ALTER COLUMN id RESTART WITH ").append(currentId).append(";\n");
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

            if (!usernameToIdMap.containsKey(userName)) {
                continue;
            }
            long userIdVal = usernameToIdMap.get(userName);

            sb.append("INSERT INTO constraints (user_id, shift_date, shift_type, constraint_type) VALUES (")
                    .append(userIdVal).append(", ")
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

            if (!usernameToIdMap.containsKey(assignedUsername)) {
                continue;
            }
            long userIdVal = usernameToIdMap.get(assignedUsername);

            Map<String, Object> presetObj = (Map<String, Object>) s.get("preset");
            String presetIdStr = "NULL";
            if (presetObj != null) {
                String presetName = asString(presetObj.get("name"));
                if (presetName != null && presetNameToIdMap.containsKey(presetName)) {
                    presetIdStr = presetNameToIdMap.get(presetName).toString();
                }
            }

            sb.append("INSERT INTO assigned_shifts (user_id, date, type, preset_id) VALUES (")
                    .append(userIdVal).append(", ")
                    .append(sqlString(dateStr)).append(", ")
                    .append(sqlString(type)).append(", ")
                    .append(presetIdStr).append(");\n");
        }

        return sb.toString();
    }

    // --- helpers ---

    private List<Map<String, Object>> readJsonArray(String backupDirName, String filename) throws IOException {
        String resourcePath = "backup/" + backupDirName + "/" + filename;
        InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(resourcePath);
        if (is == null) {
            // fallback to project resources path when running from IDE
            Path p = Path.of("src", "main", "resources", "backups", backupDirName, filename);
            if (!Files.exists(p)) {
                return new ArrayList<>();
            }
            byte[] bytes = Files.readAllBytes(p);
            return objectMapper.readValue(bytes, new TypeReference<>() {
            });
        }
        try (InputStream eis = is) {
            return objectMapper.readValue(eis, new TypeReference<>() {
            });
        }
    }

    public String generatePresetsAndWeightsInserts(String backupDirName) throws IOException {
        presetNameToIdMap.clear();
        Map<String, Object> settings = readJsonObject(backupDirName, "shiftWeightSettings.json");
        Object presetsObj = settings.get("presets");
        if (!(presetsObj instanceof Map)) {
            return "-- no shift weight presets found";
        }
        Map<String, Object> presets = (Map<String, Object>) presetsObj;

        StringBuilder sb = new StringBuilder();
        sb.append("-- shift_weight_presets and shift_weights inserts\n");
        long currentPresetId = 1;
        long currentWeightId = 1;

        for (Map.Entry<String, Object> entry : presets.entrySet()) {
            String presetName = entry.getKey();
            Map<String, Object> presetData = (Map<String, Object>) entry.getValue();

            presetNameToIdMap.put(presetName, currentPresetId);

            sb.append("INSERT INTO shift_weight_presets (id, name) VALUES (")
                    .append(currentPresetId).append(", ")
                    .append(sqlString(presetName)).append(");\n");

            List<Map<String, Object>> weights = (List<Map<String, Object>>) presetData.get("weights");
            if (weights != null) {
                for (Map<String, Object> w : weights) {
                    String dayHebrew = asString(w.get("day"));
                    String shiftTypeHebrew = asString(w.get("shiftType"));
                    Integer weightVal = (Integer) w.get("weight");

                    String dayEnum = dayHebrew != null ? Day.fromHebrewName(dayHebrew).name() : null;
                    String shiftTypeEnum = shiftTypeHebrew != null ? ShiftType.fromHebrew(shiftTypeHebrew).name() : null;

                    sb.append("INSERT INTO shift_weights (id, day, shiftType, weight, preset_id) VALUES (")
                            .append(currentWeightId).append(", ")
                            .append(sqlString(dayEnum)).append(", ")
                            .append(sqlString(shiftTypeEnum)).append(", ")
                            .append(weightVal).append(", ")
                            .append(currentPresetId).append(");\n");
                    currentWeightId++;
                }
            }
            currentPresetId++;
        }

        if (currentPresetId > 1) {
            sb.append("ALTER TABLE shift_weight_presets ALTER COLUMN id RESTART WITH ").append(currentPresetId).append(";\n");
        }
        if (currentWeightId > 1) {
            sb.append("ALTER TABLE shift_weights ALTER COLUMN id RESTART WITH ").append(currentWeightId).append(";\n");
        }
        return sb.toString();
    }

    private Map<String, Object> readJsonObject(String backupDirName, String filename) throws IOException {
        String resourcePath = "backups/" + backupDirName + "/" + filename;
        InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(resourcePath);
        if (is == null) {
            // fallback to project resources path when running from IDE
            Path p = Path.of("src", "main", "resources", "backups", backupDirName, filename);
            if (!Files.exists(p)) {
                return new HashMap<>();
            }
            byte[] bytes = Files.readAllBytes(p);
            return objectMapper.readValue(bytes, new TypeReference<>() {
            });
        }
        try (InputStream eis = is) {
            return objectMapper.readValue(eis, new TypeReference<>() {
            });
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

