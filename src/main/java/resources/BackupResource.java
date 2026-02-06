package resources;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
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

    public static class ErrorResponse {
        public String message;

        public ErrorResponse(String message) {
            this.message = message;
        }
    }
}

