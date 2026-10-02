package resources;

import auth.RoleConstants;
import io.quarkus.logging.Log;
import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import services.BackupNotFoundException;
import services.BackupService;

@Path("/api/backup")
@RolesAllowed({RoleConstants.USER, RoleConstants.ADMIN})
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
            // The method @Produces zip, so error() sets the JSON type explicitly
            return error(Response.Status.INTERNAL_SERVER_ERROR, "Failed to create backup: " + e.getMessage());
        }
    }

    @POST
    @Path("/generate-sql")
    @RolesAllowed({RoleConstants.ADMIN})
    @Consumes(MediaType.TEXT_PLAIN)
    public Response generateSqlFromBackup(String backupDirName) {
        try {
            backupService.generateSqlFromBackupDir(backupDirName);
            Log.infof("SQL generated successfully for backup '%s'. Output file created under resources/backup/results/%s", backupDirName, backupDirName);
            return Response.noContent().build();
        } catch (IllegalArgumentException e) {
            return error(Response.Status.BAD_REQUEST, e.getMessage());
        } catch (BackupNotFoundException e) {
            return error(Response.Status.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return error(Response.Status.INTERNAL_SERVER_ERROR, "Failed to generate SQL: " + e.getMessage());
        }
    }

    private Response error(Response.Status status, String message) {
        return Response.status(status)
                .type(MediaType.APPLICATION_JSON)
                .entity(new ErrorResponse(message))
                .build();
    }

    @RegisterForReflection
    public static class ErrorResponse {
        public String message;

        public ErrorResponse(String message) {
            this.message = message;
        }
    }
}
