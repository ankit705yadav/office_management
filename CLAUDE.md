# Claude Code Reference for Operation Management Platform

This document provides Claude with comprehensive context about the codebase structure, patterns, and conventions.

## Project Overview

**Operation Management Platform** is an internal business management system for HR, projects, attendance, and payroll. Built with a modern TypeScript stack.

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express + TypeScript + Sequelize ORM |
| Frontend | React 18 + TypeScript + Vite + Material-UI |
| Database | PostgreSQL 14+ |
| Real-time | Socket.io |
| Auth | JWT (15m access / 7d refresh tokens) |

## Project Structure

```
office_management/
├── backend/                     # Express API Server
│   ├── src/
│   │   ├── app.ts              # Express app, middleware setup
│   │   ├── index.ts            # Server entry, DB connection
│   │   ├── config/
│   │   │   ├── database.ts     # Sequelize connection
│   │   │   └── environment.ts  # Env config loader
│   │   ├── controllers/        # Route handlers (12 files)
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── leave.controller.ts
│   │   │   ├── attendance.controller.ts
│   │   │   ├── project.controller.ts
│   │   │   ├── task.controller.ts
│   │   │   ├── client.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── holiday.controller.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── dailyReport.controller.ts
│   │   │   └── notification.controller.ts
│   │   ├── routes/             # API route definitions (10 files)
│   │   ├── models/             # Sequelize models (18 models)
│   │   │   ├── User.ts
│   │   │   ├── Department.ts
│   │   │   ├── LeaveBalance.ts
│   │   │   ├── LeaveRequest.ts
│   │   │   ├── Project.ts
│   │   │   ├── Task.ts
│   │   │   ├── Client.ts
│   │   │   ├── Attendance.ts
│   │   │   ├── DailyReport.ts
│   │   │   ├── Payment.ts
│   │   │   ├── Notification.ts
│   │   │   └── index.ts        # Model associations
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT auth & role middleware
│   │   │   ├── roleCheck.ts    # Role-based access
│   │   │   └── validateRequest.ts
│   │   ├── services/           # Business logic
│   │   │   ├── email.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── attendance.service.ts
│   │   │   ├── storage.service.ts
│   │   │   └── socket.service.ts
│   │   ├── types/
│   │   │   └── enums.ts        # All enums (LeaveType, TaskStatus, etc.)
│   │   └── utils/
│   │       ├── jwt.ts          # Token generation/verification
│   │       ├── logger.ts       # Winston logger
│   │       └── validators.ts   # Express-validator rules
│   ├── database/
│   │   └── schema.sql          # Full DB schema with seeds
│   └── uploads/                # File storage
│
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── App.tsx             # Main routing
│   │   ├── main.tsx            # Vite entry
│   │   ├── pages/              # Route pages (11 pages)
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── LeavesPage.tsx
│   │   │   ├── AttendancePage.tsx
│   │   │   ├── EmployeesPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── ClientsPage.tsx
│   │   │   ├── PaymentsPage.tsx
│   │   │   ├── DailyReportsPage.tsx
│   │   │   ├── HolidaysPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── DashboardLayout.tsx  # Sidebar & header
│   │   │   ├── projects/
│   │   │   │   ├── KanbanBoard.tsx      # Drag-drop board
│   │   │   │   ├── TaskCard.tsx
│   │   │   │   └── TaskFormDrawer.tsx
│   │   │   └── notifications/
│   │   │       └── NotificationBell.tsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx          # Auth state
│   │   │   ├── ThemeContext.tsx
│   │   │   ├── SocketContext.tsx
│   │   │   └── NotificationContext.tsx
│   │   ├── services/           # API client services
│   │   │   ├── api.ts          # Axios instance + interceptors
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── leave.service.ts
│   │   │   ├── project.service.ts
│   │   │   └── [feature].service.ts
│   │   └── types/
│   │       └── index.ts        # TypeScript interfaces
│   └── public/
│
└── database/schema.sql         # Alternative schema location
```

## Key Patterns & Conventions

### Naming Conventions
- **Files**: `camelCase.ts` for most files, `PascalCase.ts` for models
- **Controllers**: Export named functions (`export const getUsers = ...`)
- **Routes**: Export Router instance
- **Database columns**: `snake_case` (Sequelize auto-converts)
- **TypeScript**: `PascalCase` interfaces, `camelCase` properties

### API Response Format
```typescript
// Success
{ status: 'success', message: string, data: T }

// Error
{ status: 'error', message: string }

// Paginated
{ status: 'success', data: T[], meta: { page, limit, total } }
```

### Error Handling
- Controllers use try-catch with 500 fallback
- Validation errors return 400
- Auth errors return 401/403
- Not found returns 404

### Database Patterns
- Timestamps auto-managed via PostgreSQL triggers
- Soft deletes: User status → 'inactive'
- Associations defined in `models/index.ts`
- Decimal fields for leave days (half-day support)

## Database Schema Overview

### Core Tables
| Table | Purpose |
|-------|---------|
| `users` | Employee records (id, email, role, departmentId, managerId) |
| `departments` | Department info |
| `refresh_tokens` | JWT refresh tokens |

### Leave Management
| Table | Purpose |
|-------|---------|
| `leave_balances` | Annual quota per user (sick, casual, earned, compOff, paternity) |
| `leave_requests` | Leave applications (supports half-day) |
| `leave_approvals` | Multi-level approval chain |
| `holidays` | Company holidays |

### Attendance
| Table | Purpose |
|-------|---------|
| `attendance` | Daily check-in/out records |
| `attendance_regularizations` | Regularization requests |

### Projects
| Table | Purpose |
|-------|---------|
| `clients` | Client information |
| `projects` | Project records |
| `tasks` | Tasks with dependencies |
| `task_attachments` | File attachments |

### Finance
| Table | Purpose |
|-------|---------|
| `employee_salaries` | Salary records |
| `payments` | Payment transactions |

### Other
| Table | Purpose |
|-------|---------|
| `daily_reports` | Daily work summaries |
| `daily_report_entries` | Time entries per project/task |
| `notifications` | User notifications |

## API Endpoints Summary

### Auth (`/api/auth`)
- `POST /login` - Login
- `POST /refresh-token` - Refresh JWT
- `POST /logout` - Logout
- `GET /me` - Current user
- `PUT /change-password` - Change password

### Users (`/api/users`)
- `GET /` - List users (Manager/Admin)
- `GET /:id` - Get user
- `POST /` - Create user (Admin)
- `PUT /:id` - Update user
- `DELETE /:id` - Soft delete (Admin)

### Leaves (`/api/leaves`)
- `GET /balance` - Leave balance
- `GET /` - List requests
- `POST /` - Apply for leave
- `PUT /:id/approve` - Approve
- `PUT /:id/reject` - Reject
- `PUT /:id/cancel` - Cancel

### Attendance (`/api/attendance`)
- `POST /check-in` - Check in
- `POST /check-out` - Check out
- `GET /today` - Today's status
- `GET /my` - My records
- `GET /team` - Team records (Manager)
- `POST /regularize` - Request regularization

### Projects (`/api/projects`)
- `GET /` - List projects
- `GET /:id` - Get project
- `GET /:id/board` - Kanban board data
- `POST /` - Create project
- `PUT /:id` - Update
- `DELETE /:id` - Delete
- Task endpoints under `/tasks`

### Other Routes
- `/api/clients` - Client CRUD
- `/api/payments` - Payroll management
- `/api/holidays` - Holiday calendar
- `/api/daily-reports` - Time tracking
- `/api/dashboard` - Stats & calendar
- `/api/notifications` - Notifications

## Authentication & Authorization

### Roles
| Role | Permissions |
|------|-------------|
| `admin` | Full access to all features |
| `manager` | Team management, approvals |
| `employee` | Own data only |

### Auth Flow
1. Login → Access token (15m) + Refresh token (7d)
2. API requests use Bearer token
3. On 401, frontend auto-refreshes token
4. Both expired → Redirect to login

### Key Middleware
- `authenticate` - Verify JWT, attach user to request
- `authorize(roles)` - Check user role
- `requireAdmin` - Admin only
- `requireManagerOrAdmin` - Manager or Admin
- `canManageUser` - Self or Admin

## Enums (from `types/enums.ts`)

```typescript
// User roles
enum UserRole { ADMIN = 'admin', MANAGER = 'manager', EMPLOYEE = 'employee' }

// Leave types
enum LeaveType { SICK = 'sick', CASUAL = 'casual', EARNED = 'earned', COMP_OFF = 'comp_off', PATERNITY = 'paternity', MATERNITY = 'maternity' }

// Leave status
enum LeaveStatus { PENDING = 'pending', APPROVED = 'approved', REJECTED = 'rejected', CANCELLED = 'cancelled' }

// Task status
enum TaskStatus { TODO = 'todo', IN_PROGRESS = 'in_progress', DONE = 'done', BLOCKED = 'blocked' }

// Task priority
enum TaskPriority { LOW = 'low', MEDIUM = 'medium', HIGH = 'high', URGENT = 'urgent' }

// Project status
enum ProjectStatus { ACTIVE = 'active', COMPLETED = 'completed', ON_HOLD = 'on_hold', CANCELLED = 'cancelled' }

// Payment status
enum PaymentStatus { PENDING = 'pending', PAID = 'paid', CANCELLED = 'cancelled' }
```

## Common Development Tasks

### Adding a New API Endpoint
1. Create/update controller in `backend/src/controllers/`
2. Add route in `backend/src/routes/`
3. Add validation in `backend/src/utils/validators.ts`
4. Register route in `backend/src/app.ts` if new file

### Adding a New Frontend Page
1. Create page in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Create service in `frontend/src/services/`
4. Add to sidebar in `DashboardLayout.tsx`

### Adding a New Database Table
1. Add CREATE TABLE in `backend/database/schema.sql`
2. Create model in `backend/src/models/`
3. Add associations in `models/index.ts`
4. Add to Sequelize sync in `index.ts`

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=office_management
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Operation Management
```

## Quick Start

```bash
# Database
psql -U postgres -c "CREATE DATABASE office_management;"
psql -U postgres -d office_management -f backend/database/schema.sql

# Backend (Terminal 1)
cd backend && npm install && cp .env.example .env && npm run dev

# Frontend (Terminal 2)
cd frontend && npm install && cp .env.example .env && npm run dev
```

### Default Logins
| Email | Password | Role |
|-------|----------|------|
| admin@company.com | Admin@123 | Admin |
| john.doe@company.com | Password@123 | Manager |
| jane.smith@company.com | Password@123 | Employee |

## Troubleshooting

- **Backend won't start**: Check PostgreSQL running, verify .env credentials
- **Frontend won't start**: Ensure backend is on :5000, check .env exists
- **Login fails**: Check backend logs, verify seed data exists
- **CORS errors**: Match CORS_ORIGIN with frontend URL

## Key Files Reference

| File | Purpose |
|------|---------|
| `backend/src/app.ts` | Express setup, all middleware |
| `backend/src/models/index.ts` | All model associations |
| `backend/src/types/enums.ts` | All enums |
| `backend/src/middleware/auth.ts` | Auth middleware |
| `frontend/src/App.tsx` | All routes |
| `frontend/src/contexts/AuthContext.tsx` | Auth state |
| `frontend/src/services/api.ts` | Axios config |
| `frontend/src/components/layout/DashboardLayout.tsx` | Main layout |

---
Version 1.0.0 | Built with Claude Code
