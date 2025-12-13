# Operation Management Frontend

Modern, responsive React + TypeScript frontend for the Company Name Operation Management Platform.

## Features

- **Authentication** - Secure login with JWT tokens
- **Dashboard** - Real-time stats, birthdays, anniversaries
- **Leave Management** - Apply, view, approve/reject leaves
- **Holiday Calendar** - View company holidays
- **Profile Management** - View profile, change password
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Material-UI v5** - Beautiful, accessible components
- **Vite** - Lightning-fast build tool
- **React Router v6** - Client-side routing
- **React Hook Form** - Performant form validation
- **Axios** - HTTP client with interceptors
- **date-fns** - Modern date utility library
- **React Toastify** - Toast notifications

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- Backend API running on `http://localhost:5000`

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Operation Management
VITE_ENV=development
```

### 3. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:3000`

### 4. Login

Use the default admin credentials:
- **Email**: `admin@company.com`
- **Password**: `Admin@123`

## Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   └── layout/
│   │       └── DashboardLayout.tsx
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── LeavesPage.tsx
│   │   ├── HolidaysPage.tsx
│   │   └── ProfilePage.tsx
│   ├── services/       # API services
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── leave.service.ts
│   │   ├── dashboard.service.ts
│   │   └── holiday.service.ts
│   ├── types/          # TypeScript types
│   │   └── index.ts
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Root component
│   └── main.tsx        # Entry point
├── .env.example        # Environment variables template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Features Guide

### 1. Dashboard

- **Leave Balance** - View remaining leave days by type
- **Pending Requests** - See your pending leave requests
- **Pending Approvals** - (Managers/Admins) Requests needing approval
- **Birthdays** - Upcoming team birthdays
- **Anniversaries** - Work anniversaries this month
- **Quick Actions** - Fast navigation to common tasks

### 2. Leave Management

**For Employees:**
- Apply for leave with date range and reason
- View all your leave requests
- See leave status (pending/approved/rejected)
- Cancel pending or approved requests

**For Managers/Admins:**
- View team's leave requests
- Approve or reject with comments
- See leave history

### 3. Holiday Calendar

- View all company holidays for the year
- Monthly breakdown view
- Filter by optional/mandatory
- Complete list view with details
- Year selector

### 4. Profile

- View personal information
- See department and manager
- View emergency contact details
- Change password securely

## API Integration

The frontend communicates with the backend API using Axios. All API calls include:

- Automatic JWT token attachment
- Token refresh on expiry
- Error handling
- Loading states

### Authentication Flow

1. User logs in with email/password
2. Backend returns access token (15min) and refresh token (7 days)
3. Tokens stored in localStorage
4. Access token sent with every API request
5. Auto-refresh when access token expires
6. Redirect to login if refresh fails

### Protected Routes

Routes are protected by the `ProtectedRoute` component:
- Checks if user is authenticated
- Redirects to login if not
- Shows loading spinner while checking auth

## Customization

### Theme

Edit `src/main.tsx` to customize the Material-UI theme:

```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Change primary color
    },
    // ... more options
  },
});
```

### API URL

For production, update `.env`:

```env
VITE_API_URL=https://api.yourdomain.com/api
```

### Logo

Replace the logo in `DashboardLayout.tsx`:

```typescript
<Business sx={{ fontSize: 32 }} />
// Replace with your logo
```

## Building for Production

### 1. Build the Application

```bash
npm run build
```

This creates an optimized production build in `dist/`.

### 2. Preview Production Build

```bash
npm run preview
```

### 3. Deploy

The `dist/` folder can be deployed to:

- **AWS S3 + CloudFront**
- **Netlify**
- **Vercel**
- **GitHub Pages**
- **Nginx** (static hosting)

#### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Issue: "CORS Error"

**Solution**: Ensure backend CORS is configured to allow frontend origin:

```javascript
// backend .env
CORS_ORIGIN=http://localhost:3000
```

### Issue: "API calls fail with 404"

**Solution**: Check `VITE_API_URL` in `.env` matches backend URL

### Issue: "Token expired" errors

**Solution**:
- Clear localStorage
- Login again
- Check backend JWT configuration

### Issue: "Module not found" errors

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Build fails"

**Solution**:
```bash
# Check for TypeScript errors
npm run type-check

# Fix linting issues
npm run lint
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Code splitting for faster initial load
- Lazy loading of components
- Optimized bundle size
- Tree shaking of unused code
- Compressed assets

## Security

- XSS protection via React
- CSRF protection via JWT
- Secure token storage
- Auto token refresh
- Input validation
- Password strength requirements

## Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] PWA support (offline mode)
- [ ] Dark mode toggle
- [ ] Export data to PDF/Excel
- [ ] Advanced filtering and search
- [ ] File upload for expense receipts
- [ ] Charts and analytics dashboard
- [ ] Multi-language support (i18n)

## Support

For issues or questions:
- **Email**: it@company.com
- **Internal**: Contact IT Department

---

**Version**: 1.0.0
**Last Updated**: November 2025
**License**: Proprietary - Company Name
