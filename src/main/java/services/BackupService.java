package services;

import com.fasterxml.jackson.databind.ObjectMapper;
import daos.AssignedShiftDao;
import daos.ConstraintDao;
import daos.ShiftWeightPresetDao;
import daos.UserDao;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@ApplicationScoped
public class BackupService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    @Inject
    UserDao userDao;
    @Inject
    AssignedShiftDao assignedShiftDao;
    @Inject
    ConstraintDao constraintDao;
    @Inject
    ShiftWeightPresetDao shiftWeightPresetDao;

    public byte[] createBackup() throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {

            // Add users.json
            addEntryToZip(zos, "users.json", objectMapper.writeValueAsString(userDao.listAll()));

            // Add shifts.json
            addEntryToZip(zos, "shifts.json", objectMapper.writeValueAsString(assignedShiftDao.listAll()));

            // Add constraints.json
            addEntryToZip(zos, "constraints.json", objectMapper.writeValueAsString(constraintDao.listAll()));

            // Add shiftWeightSettings.json
            Map<String, Object> settings = new HashMap<>();
            settings.put("presets", shiftWeightPresetDao.listAll());
            settings.put("timestamp", LocalDateTime.now().toString());
            addEntryToZip(zos, "shiftWeightSettings.json", objectMapper.writeValueAsString(settings));
        }
        return baos.toByteArray();
    }

    private void addEntryToZip(ZipOutputStream zos, String filename, String content) throws IOException {
        ZipEntry entry = new ZipEntry(filename);
        zos.putNextEntry(entry);
        zos.write(content.getBytes());
        zos.closeEntry();
    }

    public String generateBackupFilename() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss");
        return "backup-" + LocalDateTime.now().format(formatter) + ".zip";
    }
}

