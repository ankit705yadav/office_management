# Operation Management Platform - Elisrun Technologies

A comprehensive internal business management platform for streamlining HR, Finance, Inventory, and Project Management operations.

## Project Overview

This platform centralizes core business operations including:
- **Human Resource Management**: Leave management, attendance, holiday calendar
- **Finance & Payroll**: Payroll processing, payslip generation
- **Expense Management**: Employee expense claims with approval workflow
- **Inventory Management**: Company asset tracking and management
- **Project Management**: Lightweight Jira-like project and task management

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **React Router v6** for routing
- **Material-UI** for UI components
- **Axios** for API calls
- **React Query** for server state management

### Backend
- **Node.js** with Express.js & TypeScript
- **PostgreSQL** with Sequelize ORM
- **JWT** for authentication
- **Nodemailer** for email notifications
- **AWS S3** for file storage
- **AWS SES** for email service

### Infrastructure
- **AWS EC2/Elastic Beanstalk**: API hosting
- **AWS RDS**: PostgreSQL database
- **AWS S3**: File storage
- **AWS CloudFront**: CDN for frontend
- **Docker**: Containerization for development

## Project Structure

```
office_management/
├── README.md                 # This file
├── .gitignore               # Git ignore rules
├── docker-compose.yml       # Docker setup for local development
├── frontend/                # React application
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   ├── public/
│   └── .env.example
└── backend/                 # Express API
    ├── package.json
    ├── tsconfig.json
    ├── src/
    ├── uploads/
    └── .env.example
```

## Getting Started

### Prerequisites
- Node.js v18 or higher
- PostgreSQL 14 or higher
- npm or yarn
- AWS account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd office_management
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your .env file with database credentials
   npm run migrate
   npm run seed
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Configure your .env file with API endpoint
   npm start
   ```

4. **Using Docker (Alternative)**
   ```bash
   docker-compose up
   ```

## User Roles & Permissions

### Employee (Default)
- View dashboard (holidays, birthdays)
- Apply for leave and track balance
- Submit expense claims
- View/download payslips
- Manage assigned tasks

### Manager
- All Employee permissions
- Approve/reject team leave requests
- Approve/reject team expense claims
- Create projects and assign tasks
- View team calendar

### Admin/HR
- Full system access
- Manage employee data
- Upload holiday calendar
- Process payroll
- Manage inventory
- Oversee all modules

## Development Phases

### Phase 1: Core HR Foundation (Weeks 1-8) ✓ In Progress
- User authentication & authorization
- Employee database management
- Leave management system
- Holiday calendar & dashboard

### Phase 2: Finance & Expenses (Weeks 9-14)
- Expense management
- Payroll processing
- Payslip generation

### Phase 3: Operations & Collaboration (Weeks 15-20)
- Inventory management
- Project management

### Phase 4: Testing & Launch (Weeks 21-22)
- User acceptance testing
- Performance optimization
- Production deployment

## API Documentation

Once the backend is running, API documentation is available at:
- Local: `http://localhost:5000/api-docs`
- Swagger UI with all endpoints, request/response schemas

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/operation_mgmt
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-s3-bucket
AWS_SES_REGION=us-east-1
EMAIL_FROM=noreply@elisrun.com
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

## Testing

### Backend
```bash
cd backend
npm run test
npm run test:coverage
```

### Frontend
```bash
cd frontend
npm run test
npm run test:coverage
```

## Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

### AWS Deployment
Refer to `docs/deployment.md` for detailed AWS deployment instructions.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests
4. Submit a pull request
5. Await code review and approval

## Security

- All passwords are hashed using bcrypt
- JWT tokens with 15-minute expiry
- Refresh tokens for extended sessions
- Role-based access control (RBAC)
- Input validation on all endpoints
- SQL injection prevention via ORM
- File upload validation and scanning

## Support & Contact

For issues, questions, or feature requests:
- **Email**: it@elisrun.com
- **Internal**: Contact the IT department

## License

Internal use only - Elisrun Technologies Pvt. Ltd.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-17
**Maintained by**: Elisrun IT Team
