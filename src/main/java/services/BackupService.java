package services;

import com.fasterxml.jackson.databind.ObjectMapper;
import daos.AssignedShiftDao;
import daos.ConstraintDao;
import daos.ShiftWeightPresetDao;
import daos.UserDao;
import entities.AssignedShift;
import entities.Constraint;
import entities.ShiftWeight;
import entities.ShiftWeightPreset;
import entities.User;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Backups use the old (pre-Quarkus) backup format, so they can be fed back into {@link BackupSqlGenerator}:
 * dates are epoch millis, users are referenced by name and enums by their Hebrew representation.
 */
@ApplicationScoped
public class BackupService {

    private static final Pattern VALID_BACKUP_DIR_NAME = Pattern.compile("[\\w-]+");

    private final ObjectMapper objectMapper = new ObjectMapper();
    @Inject
    UserDao userDao;
    @Inject
    AssignedShiftDao assignedShiftDao;
    @Inject
    ConstraintDao constraintDao;
    @Inject
    ShiftWeightPresetDao shiftWeightPresetDao;
    @Inject
    ShiftWeightSettingsService shiftWeightSettingsService;
    @Inject
    BackupSqlGenerator backupSqlGenerator;

    @Transactional
    public byte[] createBackup() throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            addEntryToZip(zos, "users.json", userDao.listAll().stream().map(this::toBackup).toList());
            addEntryToZip(zos, "shifts.json", assignedShiftDao.listAll().stream().map(this::toBackup).toList());
            addEntryToZip(zos, "constraints.json", constraintDao.listAll().stream().map(this::toBackup).toList());
            addEntryToZip(zos, "shiftWeightSettings.json", shiftWeightSettingsBackup());
        }
        return baos.toByteArray();
    }

    private Map<String, Object> toBackup(User user) {
        Map<String, Object> backup = new LinkedHashMap<>();
        backup.put("name", user.name);
        backup.put("password", user.password);
        backup.put("score", user.score);
        backup.put("role", user.role);
        return backup;
    }

    private Map<String, Object> toBackup(AssignedShift shift) {
        Map<String, Object> backup = shiftBackup(shift.date, shift.type);
        backup.put("assignedUsername", shift.assignedUser != null ? shift.assignedUser.name : null);
        backup.put("preset", shift.shiftWeightPreset != null ? toBackup(shift.shiftWeightPreset) : null);
        return backup;
    }

    private Map<String, Object> toBackup(Constraint constraint) {
        Map<String, Object> backup = new LinkedHashMap<>();
        backup.put("shift", shiftBackup(constraint.date, constraint.type));
        backup.put("constraintType", constraint.constraintType.getHebrewRepresentation());
        backup.put("userId", constraint.user.name);
        return backup;
    }

    private Map<String, Object> toBackup(ShiftWeightPreset preset) {
        Map<String, Object> backup = new LinkedHashMap<>();
        backup.put("name", preset.name);
        backup.put("weights", preset.shiftWeights.stream().map(this::toBackup).toList());
        return backup;
    }

    private Map<String, Object> toBackup(ShiftWeight weight) {
        Map<String, Object> backup = new LinkedHashMap<>();
        backup.put("day", weight.day.getHebrewName());
        backup.put("shiftType", weight.shiftType.getHebrewRepresentation());
        backup.put("weight", weight.weight);
        return backup;
    }

    private Map<String, Object> shiftBackup(LocalDate date, ShiftType type) {
        Map<String, Object> backup = new LinkedHashMap<>();
        // BackupSqlGenerator converts the millis back using the system default zone
        backup.put("date", date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli());
        backup.put("type", type.getHebrewRepresentation());
        return backup;
    }

    private Map<String, Object> shiftWeightSettingsBackup() {
        Map<String, Object> presets = new LinkedHashMap<>();
        shiftWeightPresetDao.listAll().forEach(preset -> presets.put(preset.name, toBackup(preset)));
        ShiftWeightPreset currentPreset = shiftWeightSettingsService.getCurrentPreset();

        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("currentPresetObject", currentPreset != null ? toBackup(currentPreset) : null);
        settings.put("presets", presets);
        settings.put("timestamp", LocalDateTime.now().toString());
        return settings;
    }

    private void addEntryToZip(ZipOutputStream zos, String filename, Object content) throws IOException {
        ZipEntry entry = new ZipEntry(filename);
        zos.putNextEntry(entry);
        zos.write(objectMapper.writeValueAsString(content).getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();
    }

    public String generateBackupFilename() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss");
        return "backup-" + LocalDateTime.now().format(formatter) + ".zip";
    }

    /**
     * @throws IllegalArgumentException if the name isn't a plain directory name (prevents path traversal)
     * @throws BackupNotFoundException  if there's no such backup
     */
    public void generateSqlFromBackupDir(String backupDirName) throws IOException {
        if (backupDirName == null || !VALID_BACKUP_DIR_NAME.matcher(backupDirName.trim()).matches()) {
            throw new IllegalArgumentException("Invalid backup name: " + backupDirName);
        }
        String name = backupDirName.trim();
        if (!backupSqlGenerator.backupExists(name)) {
            throw new BackupNotFoundException(name);
        }
        backupSqlGenerator.generateSqlFromBackupDir(name);
    }
}
