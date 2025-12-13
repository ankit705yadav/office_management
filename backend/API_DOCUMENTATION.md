# Operation Management Platform - API Documentation

Version: 1.0.0
Base URL: `http://localhost:5000/api`

## Table of Contents
1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Leave Management](#leave-management)
4. [Holiday Calendar](#holiday-calendar)
5. [Dashboard](#dashboard)
6. [Error Handling](#error-handling)

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@company.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "role": "employee",
      "departmentId": 1
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Refresh Token
**POST** `/auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User
**GET** `/auth/me`

### Logout
**POST** `/auth/logout`

### Change Password
**PUT** `/auth/change-password`

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

---

## User Management

### Get All Users
**GET** `/users`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` - Search by name or email
- `role` - Filter by role (employee/manager/admin)
- `status` - Filter by status (active/inactive/terminated)
- `departmentId` - Filter by department

**Access:** Manager/Admin only

**Response:**
```json
{
  "status": "success",
  "data": {
    "users": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

### Get User by ID
**GET** `/users/:id`

### Create User
**POST** `/users`

**Access:** Admin only

**Request Body:**
```json
{
  "email": "newuser@company.com",
  "password": "Password@123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+91 9876543210",
  "dateOfBirth": "1990-05-15",
  "dateOfJoining": "2024-01-15",
  "role": "employee",
  "status": "active",
  "departmentId": 1,
  "managerId": 5,
  "address": "123 Main St",
  "emergencyContactName": "John Smith",
  "emergencyContactPhone": "+91 9876543211"
}
```

### Update User
**PUT** `/users/:id`

**Access:** Self or Admin

### Delete User
**DELETE** `/users/:id`

**Access:** Admin only
*Note: This is a soft delete (sets status to 'terminated')*

### Get User's Team
**GET** `/users/:id/team`

Returns all subordinates for a manager.

### Get All Departments
**GET** `/users/departments`

---

## Leave Management

### Apply for Leave
**POST** `/leaves`

**Request Body:**
```json
{
  "leaveType": "casual",
  "startDate": "2024-12-25",
  "endDate": "2024-12-27",
  "reason": "Family vacation planned in advance"
}
```

**Leave Types:** sick, casual, earned, comp_off, paternity, maternity

### Get All Leave Requests
**GET** `/leaves`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` - Filter by status (pending/approved/rejected/cancelled)
- `userId` - Filter by user (Admin only)
- `startDate` - Filter by date range
- `endDate` - Filter by date range

**Role-based Access:**
- Employee: See only their own requests
- Manager: See their team's requests
- Admin: See all requests

### Get Leave Request by ID
**GET** `/leaves/:id`

### Get Leave Balance
**GET** `/leaves/balance`

**Query Parameters:**
- `userId` (optional, admin/manager only)
- `year` (optional, default: current year)

**Response:**
```json
{
  "status": "success",
  "data": {
    "leaveBalance": {
      "id": 1,
      "userId": 1,
      "year": 2024,
      "sickLeave": 12.0,
      "casualLeave": 8.5,
      "earnedLeave": 15.0,
      "compOff": 0.0,
      "paternityMaternity": 0.0
    }
  }
}
```

### Approve Leave
**PUT** `/leaves/:id/approve`

**Access:** Manager/Admin only

**Request Body:**
```json
{
  "comments": "Approved. Enjoy your vacation!"
}
```

### Reject Leave
**PUT** `/leaves/:id/reject`

**Access:** Manager/Admin only

**Request Body:**
```json
{
  "comments": "Cannot approve due to team shortage during this period"
}
```

### Cancel Leave
**PUT** `/leaves/:id/cancel`

**Access:** Self or Admin

---

## Holiday Calendar

### Get All Holidays
**GET** `/holidays`

**Query Parameters:**
- `year` (default: current year)
- `isOptional` (true/false)

**Response:**
```json
{
  "status": "success",
  "data": {
    "holidays": [
      {
        "id": 1,
        "date": "2025-01-26",
        "name": "Republic Day",
        "description": "National holiday",
        "isOptional": false,
        "year": 2025
      }
    ],
    "count": 10
  }
}
```

### Get Upcoming Holidays
**GET** `/holidays/upcoming`

**Query Parameters:**
- `limit` (default: 5)

### Get Holiday by ID
**GET** `/holidays/:id`

### Create Holiday
**POST** `/holidays`

**Access:** Admin only

**Request Body:**
```json
{
  "date": "2025-12-25",
  "name": "Christmas",
  "description": "Christmas Day",
  "isOptional": false,
  "year": 2025
}
```

### Bulk Create Holidays
**POST** `/holidays/bulk`

**Access:** Admin only

**Request Body:**
```json
{
  "holidays": [
    {
      "date": "2025-01-26",
      "name": "Republic Day",
      "description": "National holiday",
      "isOptional": false
    },
    {
      "date": "2025-08-15",
      "name": "Independence Day",
      "description": "National holiday",
      "isOptional": false
    }
  ]
}
```

### Update Holiday
**PUT** `/holidays/:id`

**Access:** Admin only

### Delete Holiday
**DELETE** `/holidays/:id`

**Access:** Admin only

---

## Dashboard

### Get Dashboard Stats
**GET** `/dashboard/stats`

Returns personalized statistics based on user role.

**Response:**
```json
{
  "status": "success",
  "data": {
    "stats": {
      "user": {
        "leaveBalance": { ... }
      },
      "leaves": {
        "pending": 2
      },
      "notifications": {
        "unread": 5
      },
      "approvals": {
        "pending": 8
      },
      "admin": {
        "totalEmployees": 150,
        "monthlyExpenses": 450000
      }
    }
  }
}
```

### Get Upcoming Birthdays
**GET** `/dashboard/birthdays`

**Query Parameters:**
- `limit` (default: 10)

**Response:**
```json
{
  "status": "success",
  "data": {
    "birthdays": [
      {
        "id": 5,
        "firstName": "Alice",
        "lastName": "Johnson",
        "email": "alice@company.com",
        "dateOfBirth": "1992-11-20",
        "department": {
          "id": 1,
          "name": "IT"
        }
      }
    ]
  }
}
```

### Get Work Anniversaries
**GET** `/dashboard/anniversaries`

**Query Parameters:**
- `limit` (default: 10)

Returns employees with work anniversaries this month.

### Get Recent Activities
**GET** `/dashboard/activities`

**Query Parameters:**
- `limit` (default: 10)

Returns recent notifications for the current user.

### Mark Notification as Read
**PUT** `/dashboard/notifications/:id/read`

### Mark All Notifications as Read
**PUT** `/dashboard/notifications/read-all`

### Get Team Calendar
**GET** `/dashboard/team-calendar`

**Query Parameters:**
- `startDate` - Filter by date range
- `endDate` - Filter by date range

Returns approved leave requests for the team (role-based filtering).

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Authentication required or invalid token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Common Error Messages

**401 Unauthorized:**
```json
{
  "status": "error",
  "message": "Authentication required. Please provide a valid token."
}
```

**403 Forbidden:**
```json
{
  "status": "error",
  "message": "You do not have permission to access this resource.",
  "requiredRoles": ["admin"],
  "yourRole": "employee"
}
```

**400 Validation Error:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

---

## Role-Based Access Control

### Roles

1. **Employee** - Default role
   - View own profile
   - Apply for leaves
   - View holidays
   - Submit expenses
   - View assigned tasks

2. **Manager** - Team lead role
   - All Employee permissions
   - View team members
   - Approve/reject team's leave requests
   - Approve/reject team's expense claims
   - Create and manage projects

3. **Admin** - Full system access
   - All Manager permissions
   - Create/update/delete users
   - Manage departments
   - Upload holiday calendar
   - Process payroll
   - Manage inventory
   - View system-wide statistics

### Protected Endpoints

Most endpoints require authentication. Additional role restrictions are noted in each endpoint description.

---

## Pagination

All list endpoints support pagination with these query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response includes:**
```json
{
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Window:** 15 minutes
- **Max Requests:** 100 per IP

When limit is exceeded:
```json
{
  "status": "error",
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"Admin@123"}'

# Get user profile (with token)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Import the API collection (if provided)
2. Set environment variable `baseUrl` = `http://localhost:5000/api`
3. Use the login endpoint to get access token
4. Set token in Authorization tab (Bearer Token)

---

**Need help?** Contact the IT department at it@company.com
