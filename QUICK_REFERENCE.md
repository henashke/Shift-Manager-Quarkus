# Shift Manager API - Quick Reference Guide

## Authentication Flow

1. **Register User**
   ```bash
   curl -X POST http://localhost:8081/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "name": "john_doe",
       "password": "secure_password123"
     }'
   ```

2. **Login and Get Token**
   ```bash
   curl -X POST http://localhost:8081/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "name": "john_doe",
       "password": "secure_password123"
     }'
   ```

   Response:
   ```json
   {
     "message": "Login successful",
     "username": "john_doe",
     "role": "user",
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

3. **Use Token in Requests**
   ```bash
   curl -X GET http://localhost:8081/api/users \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

## Common Use Cases

### Create Constraints for Current Week

```bash
curl -X POST http://localhost:8081/api/constraints \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "userId": 1,
      "date": "2024-06-17",
      "type": "DAY",
      "constraintType": "CANT"
    },
    {
      "userId": 1,
      "date": "2024-06-18",
      "type": "NIGHT",
      "constraintType": "PREFER"
    }
  ]'
```

### Suggest Shifts for Multiple Users

```bash
curl -X POST http://localhost:8081/api/shifts/suggest \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [1, 2, 3, 4],
    "startDate": "2024-06-16",
    "endDate": "2024-06-22"
  }'
```

### Recalculate All User Scores

```bash
curl -X POST http://localhost:8081/api/shifts/recalculateAllUsersScores \
  -H "Authorization: Bearer {token}"
```

### Delete Week Shifts

```bash
curl -X DELETE http://localhost:8081/api/shifts/week \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "weekStart": "2024-06-16"
  }'
```

### Download Backup

```bash
curl -X GET http://localhost:8081/api/backup \
  -H "Authorization: Bearer {token}" \
  -o backup-$(date +%Y%m%d_%H%M%S).zip
```

### Get Shift Weight Settings

```bash
curl -X GET http://localhost:8081/api/shift-weight-settings \
  -H "Authorization: Bearer {token}"
```

### Set Current Preset

```bash
curl -X POST http://localhost:8081/api/shift-weight-settings/current-preset \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPreset": "custom"
  }'
```

## Constraint Types

- **CANT**: User cannot work this shift
- **PREFER**: User prefers to work this shift

## Shift Types

Use the enum values:

- `DAY` - يوم (Day shift)
- `NIGHT` - ليل (Night shift)

## Roles

- `user` - Regular user
- `admin` - Administrator with elevated permissions

## Error Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Invalid credentials or missing token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

## Database Setup

Run Flyway migrations automatically on startup:

```properties
quarkus.flyway.migrate-at-start=true
quarkus.flyway.locations=filesystem:migration
```

The application will automatically:

1. Create/update the database schema
2. Add the `role` column to users
3. Create the `constraints` table
4. Add `date` and `type` columns to assigned_shifts

## JWT Configuration

Edit `src/main/resources/application.properties`:

```properties
# Change this in production!
app.jwt.secret=your-secret-key-should-be-at-least-32-chars-long-change-this-in-production
app.jwt.issuer=shift-manager
app.jwt.expiration-hours=24
```

## Development Notes

### Adding Authentication to New Endpoints

To require authentication on an endpoint, add:

```java

@Path("/api/protected")
@Authenticated
public class ProtectedResource {
    // All methods require authentication
}
```

### Adding Role-Based Access Control

```java

@Path("/api/admin")
@RolesAllowed("admin")
public class AdminResource {
    // Only admin users can access
}

@POST
@RolesAllowed({"admin", "user"})
public Response create(AddUserCommand command) {
    // Both admin and user can access
}
```

### Getting Current User Information

```java

@Inject
@Claims
private ClaimValue<String> username;

@Inject
@Claims
private ClaimValue<String> role;
```

## Performance Tips

1. **Constraint Checking**: The `suggestAssignments` method checks constraints for each user and shift combination. For
   large datasets, consider caching constraint results.

2. **Score Recalculation**: The `recalculateAllUsersScores` method iterates through all users and their shifts. Consider
   paginating this operation.

3. **Backup Size**: Large backup files may take time to generate. Consider implementing chunked responses for large
   datasets.

## Troubleshooting

### JWT Token Not Working

1. Verify token format: `Authorization: Bearer <token>`
2. Check token expiration (default 24 hours)
3. Verify secret key matches in application.properties
4. Check issued token hasn't been modified

### Constraint Not Preventing Shift Assignment

1. Verify constraint type is "CANT" (not "PREFER")
2. Check constraint date and shift type match exactly
3. Verify user ID matches in constraint

### Migrations Not Running

1. Check migration file names follow Flyway convention: `V{version}__{description}.sql`
2. Verify migration location is correct: `filesystem:migration`
3. Check database connection is working
4. Review Flyway logs for detailed errors

## Future Enhancements

1. Add transaction support for bulk operations
2. Implement caching for frequently accessed data
3. Add pagination to list endpoints
4. Implement search and filtering
5. Add audit logging
6. Implement soft deletes
7. Add batch operations
8. Implement WebSocket support for real-time updates

