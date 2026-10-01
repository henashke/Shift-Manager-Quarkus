package services;

public class BackupNotFoundException extends RuntimeException {

    public BackupNotFoundException(String backupDirName) {
        super("Backup not found: " + backupDirName);
    }

}
