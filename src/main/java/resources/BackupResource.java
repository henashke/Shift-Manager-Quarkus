package resources;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import services.BackupService;

@Path("/api/backup")
public class BackupResource {

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
            // run generator and create output file under resources/backup/results/{backupDirName}
            backupService.generateSqlFromBackupDir(backupDirName);
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
