package resources;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import services.BackupService;

@Path("/api/backup")
public class BackupResource {

    Logger log = LogManager.getLogger(BackupResource.class);

    @Inject
    BackupService backupService;

    @GET
    @Produces("application/zip")
    public Response getBackup() {
        try {
            byte[] backup = backupService.createBackup();
            String filename = backupService.generateBackupFilename();

            StreamingOutput output = os -> os.write(backup);

            return Response.ok(output, "application/zip")
                    .header("Content-Disposition", "attachment; filename=" + filename)
                    .header("Content-Length", backup.length)
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("Failed to create backup: " + e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/generate-sql")
    @Consumes(MediaType.TEXT_PLAIN)
    public Response generateSqlFromBackup(String backupDirName) {
        try {
            backupService.generateSqlFromBackupDir(backupDirName);
            log.info("SQL generated successfully for backup '{}'. Output file created under resources/backup/results/{}", backupDirName, backupDirName);
            return Response.noContent().build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("Failed to generate SQL: " + e.getMessage()))
                    .build();
        }
    }

    public static class ErrorResponse {
        public String message;

        public ErrorResponse(String message) {
            this.message = message;
        }
    }
}
