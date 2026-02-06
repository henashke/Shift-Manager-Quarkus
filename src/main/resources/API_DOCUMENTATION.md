# Shift Manager API Documentation

## Base URL

All endpoints are prefixed with the base URL of your server.

## Authentication

Most endpoints require JWT authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST `/api/auth/signup`

Create a new user account.

**Request Body:**

```json
{
  "name": "username",
  "password": "password123"
}
```

**Response (201 Created):**

```json
{
  "message": "User created successfully"
}
```

**Error Responses:**

- `400 Bad Request`: Missing username or password
- `409 Conflict`: Username already exists

---

#### POST `/api/auth/login`

Authenticate and receive a JWT token.

**Request Body:**

```json
{
  "name": "username",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "message": "Login successful",
  "username": "username",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400 Bad Request`: Missing username or password
- `401 Unauthorized`: Invalid credentials

---

### Users

#### GET `/api/users`

Get all users. **Requires authentication.**

**Response (200 OK):**

```json
[
  {
    "name": "username",
    "role": "user",
    "weights": [
      {
        "shiftType": "יום",
        "weight": 1.0
      },
      {
        "shiftType": "לילה",
        "weight": 1.5
      }
    ]
  }
]
```

---

#### GET `/api/users/:id`

Get a specific user by ID. **Requires authentication.**

**Response (200 OK):**

```json
{
  "name": "username",
  "role": "user",
  "weights": [
    {
      "shiftType": "יום",
      "weight": 1.0
    }
  ]
}
```

**Error Responses:**

- `404 Not Found`: User not found

---

#### POST `/api/users`

Create a new user. **Requires authentication.**

**Request Body:**

```json
{
  "name": "newuser",
  "password": "password123",
  "role": "user",
  "weights": [
    {
      "shiftType": "יום",
      "weight": 1.0
    },
    {
      "shiftType": "לילה",
      "weight": 1.5
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "name": "newuser",
  "role": "user",
  "weights": [
    ...
  ]
}
```

**Error Responses:**

- `400 Bad Request`: Invalid user data
- `409 Conflict`: User already exists

---

#### PUT `/api/users/:id`

Update a user. **Requires authentication.**

**Request Body:**

```json
{
  "name": "updatedname",
  "role": "admin",
  "weights": [
    {
      "shiftType": "יום",
      "weight": 2.0
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "name": "updatedname",
  "role": "admin",
  "weights": [
    ...
  ]
}
```

**Error Responses:**

- `400 Bad Request`: Invalid update data
- `404 Not Found`: User not found

---

#### DELETE `/api/users/:id`

Delete a user. **Requires admin role.**

**Response (204 No Content)**

**Error Responses:**

- `403 Forbidden`: Not an admin
- `404 Not Found`: User not found

---

### Shifts

#### GET `/api/shifts`

Get all shifts. **Requires authentication.**

**Response (200 OK):**

```json
[
  {
    "date": "2024-06-15",
    "type": "יום",
    "assignedUsername": "username"
  },
  {
    "date": "2024-06-15",
    "type": "לילה",
    "assignedUsername": "anotheruser"
  }
]
```

---

#### POST `/api/shifts`

Add shifts (single or multiple). **Requires admin role.**

**Request Body:**

```json
[
  {
    "date": "2024-06-15",
    "type": "יום",
    "assignedUsername": "username"
  },
  {
    "date": "2024-06-16",
    "type": "לילה",
    "assignedUsername": "anotheruser"
  }
]
```

**Response (201 Created)**

**Error Responses:**

- `400 Bad Request`: Invalid shift data or constraint violation (e.g., user has a "CANT" constraint for this shift)
- `403 Forbidden`: Not an admin

**Note:** The system validates that assigned users don't have CANT constraints for the shifts being assigned.

---

#### DELETE `/api/shifts`

Delete a specific shift. **Requires admin role.**

**Request Body:**

```json
{
  "date": "2024-06-15",
  "type": "יום"
}
```

**Response:**

- `200 OK`: Shift deleted
- `404 Not Found`: Shift not found

**Error Responses:**

- `400 Bad Request`: Invalid request data
- `403 Forbidden`: Not an admin

---

#### DELETE `/api/shifts/week`

Delete all shifts for a specific week (Sunday-Saturday). **Requires admin role.**

**Request Body:**

```json
{
  "weekStart": "2024-06-16"
}
```

**Response (200 OK):**

```json
{
  "deleted": 14
}
```

**Error Responses:**

- `400 Bad Request`: Missing or invalid weekStart
- `403 Forbidden`: Not an admin

---

#### POST `/api/shifts/suggest`

Suggest shift assignments based on user weights and constraints. **Requires admin role.**

**Request Body:**

```json
{
  "userIds": [
    "user1",
    "user2",
    "user3"
  ],
  "startDate": "2024-06-16",
  "endDate": "2024-06-22"
}
```

**Response (200 OK):**

```json
[
  {
    "date": "2024-06-16",
    "type": "יום",
    "assignedUsername": "user1"
  },
  {
    "date": "2024-06-16",
    "type": "לילה",
    "assignedUsername": "user2"
  }
]
```

**Error Responses:**

- `400 Bad Request`: Invalid request data
- `403 Forbidden`: Not an admin

---

#### POST `/api/shifts/recalculateAllUsersScores`

Recalculate scores for all users based on their assigned shifts. **Requires admin role.**

**Request Body:** Empty

**Response (200 OK)**

**Error Responses:**

- `403 Forbidden`: Not an admin

---

### Constraints

#### GET `/api/constraints`

Get all constraints for the authenticated user. **Requires authentication.**

**Response (200 OK):**

```json
[
  {
    "userId": "username",
    "shift": {
      "date": "2024-06-15",
      "type": "יום"
    },
    "constraintType": "CANT"
  },
  {
    "userId": "username",
    "shift": {
      "date": "2024-06-16",
      "type": "לילה"
    },
    "constraintType": "PREFER"
  }
]
```

---

#### GET `/api/constraints/user/:userId`

Get all constraints for a specific user. **Requires authentication.**

**Response (200 OK):**

```json
[
  {
    "userId": "username",
    "shift": {
      "date": "2024-06-15",
      "type": "יום"
    },
    "constraintType": "CANT"
  }
]
```

---

#### POST `/api/constraints`

Create one or more constraints. **Requires authentication.**

Users can only create constraints for themselves unless they are admin.

**Request Body:**

```json
[
  {
    "userId": "username",
    "shift": {
      "date": "2024-06-15",
      "type": "יום"
    },
    "constraintType": "CANT"
  },
  {
    "userId": "username",
    "shift": {
      "date": "2024-06-16",
      "type": "לילה"
    },
    "constraintType": "PREFER"
  }
]
```

**Constraint Types:**

- `CANT`: User cannot work this shift
- `PREFER`: User prefers this shift

**Response (201 Created):**

```json
{
  "message": "Constraint(s) created successfully"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid constraint data
- `403 Forbidden`: Attempting to create constraints for other users without admin role

---

#### DELETE `/api/constraints`

Delete a specific constraint. **Requires authentication.**

Users can only delete their own constraints unless they are admin.

**Request Body:**

```json
{
  "userId": "username",
  "date": "2024-06-15",
  "shiftType": "יום"
}
```

**Response (200 OK):**

```json
{
  "message": "Constraint deleted successfully"
}
```

**Error Responses:**

- `400 Bad Request`: Missing required fields or invalid data
- `403 Forbidden`: Attempting to delete another user's constraints without admin role
- `404 Not Found`: Constraint not found

---

### Shift Weight Settings

#### GET `/api/shift-weight-settings`

Get shift weight settings including all presets and current preset. **Requires authentication.**

**Response (200 OK):**

```json
{
  "currentPreset": "default",
  "presets": {
    "default": {
      "name": "default",
      "weights": [
        {
          "shiftType": "יום",
          "weight": 1.0
        },
        {
          "shiftType": "לילה",
          "weight": 1.5
        }
      ]
    },
    "custom": {
      "name": "custom",
      "weights": [
        {
          "shiftType": "יום",
          "weight": 2.0
        },
        {
          "shiftType": "לילה",
          "weight": 3.0
        }
      ]
    }
  }
}
```

---

#### POST `/api/shift-weight-settings/preset`

Save a new preset. **Requires admin role.**

**Request Body:**

```json
{
  "name": "custom",
  "weights": [
    {
      "shiftType": "יום",
      "weight": 2.0
    },
    {
      "shiftType": "לילה",
      "weight": 3.0
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "message": "Presets saved"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid data
- `403 Forbidden`: Not an admin

---

#### POST `/api/shift-weight-settings/current-preset`

Set the current active preset. **Requires admin role.**

**Request Body:**

```json
{
  "currentPreset": "custom"
}
```

**Response (200 OK):**

```json
{
  "message": "Current preset set"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid data or preset not found
- `403 Forbidden`: Not an admin

---

### Backup

#### GET `/api/backup`

Download a backup of all data (users, shifts, constraints, settings) as a ZIP file. **Requires authentication.**

**Response (200 OK):**

- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename=backup-YYYY-MM-DD_HH-mm-ss.zip`

The ZIP file contains:

- `users.json`
- `shifts.json`
- `constraints.json`
- `shiftWeightSettings.json`

---

## Data Models

### User

```json
{
  "name": "string (username)",
  "password": "string (only for create/update)",
  "role": "string (user or admin)",
  "weights": [
    {
      "shiftType": "string (יום or לילה)",
      "weight": "number"
    }
  ]
}
```

### Shift

```json
{
  "date": "string (YYYY-MM-DD)",
  "type": "string (יום or לילה)"
}
```

### AssignedShift

```json
{
  "date": "string (YYYY-MM-DD)",
  "type": "string (יום or לילה)",
  "assignedUsername": "string"
}
```

### Constraint

```json
{
  "userId": "string (username)",
  "shift": {
    "date": "string (YYYY-MM-DD)",
    "type": "string (יום or לילה)"
  },
  "constraintType": "string (CANT or PREFER)"
}
```

### ShiftWeight

```json
{
  "shiftType": "string (יום or לילה)",
  "weight": "number"
}
```

### ShiftWeightPreset

```json
{
  "name": "string",
  "weights": [
    {
      "shiftType": "string (יום or לילה)",
      "weight": "number"
    }
  ]
}
```

---

## Notes

1. **Date Format**: All dates use `YYYY-MM-DD` format (e.g., `2024-06-15`)
2. **Shift Types**: Hebrew strings `יום` (day) and `לילה` (night)
3. **Roles**: `user` (regular user) and `admin` (administrator)
4. **Constraint Types**: `CANT` (cannot work) and `PREFER` (prefers to work)
5. **Authorization**: Admin-only endpoints return `403 Forbidden` for non-admin users
6. **Token**: JWT token is returned on login and must be included in subsequent requests
