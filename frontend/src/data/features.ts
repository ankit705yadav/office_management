export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  details: string[];
}

export interface FeatureCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: Feature[];
}

export const keyFeatures: Feature[] = [
  {
    id: 'hr',
    title: 'HR Management',
    description: 'Streamline leave requests, track attendance, and manage employee data with ease.',
    icon: 'users',
    details: ['Leave Management', 'Attendance Tracking', 'Holiday Calendar'],
  },
  {
    id: 'projects',
    title: 'Project Management',
    description: 'Organize tasks with Kanban boards, assign work, and track progress in real-time.',
    icon: 'kanban',
    details: ['Kanban Boards', 'Task Assignment', 'Progress Tracking'],
  },
  {
    id: 'attendance',
    title: 'Smart Attendance',
    description: 'Digital check-in/out system with regularization requests and team insights.',
    icon: 'clock',
    details: ['Check-in/Check-out', 'Regularization', 'Team Reports'],
  },
  {
    id: 'reports',
    title: 'Daily Reports',
    description: 'Track daily work with structured time entries and team visibility.',
    icon: 'file',
    details: ['Time Entries', 'Work Summaries', 'Team Visibility'],
  },
];

export const upcomingFeatures: FeatureCategory[] = [
  {
    id: 'finance-payroll',
    title: 'Finance & Payroll',
    description: 'Streamlined financial operations - Coming Soon',
    icon: 'dollar',
    features: [
      {
        id: 'payroll',
        title: 'Payroll Processing',
        description: 'Automated payroll calculation and processing.',
        icon: 'calculator',
        details: ['Salary calculation', 'Deductions', 'Tax handling', 'Batch processing'],
      },
      {
        id: 'payslips',
        title: 'Payslip Generation',
        description: 'Generate and distribute digital payslips.',
        icon: 'file-text',
        details: ['PDF generation', 'Email delivery', 'History archive', 'Custom templates'],
      },
      {
        id: 'expenses',
        title: 'Expense Claims',
        description: 'Submit and approve expense claims with receipt uploads.',
        icon: 'receipt',
        details: ['Receipt upload', 'Category caps', 'Approval workflow', 'Reimbursement tracking'],
      },
    ],
  },
];

export const detailedFeatures: FeatureCategory[] = [
  {
    id: 'hr-management',
    title: 'HR Management',
    description: 'Complete human resource management solution',
    icon: 'users',
    features: [
      {
        id: 'leave',
        title: 'Leave Management',
        description: 'Simplified leave application with multi-level approval workflow.',
        icon: 'calendar',
        details: ['Multiple leave types', 'Balance tracking', 'Multi-level approval', 'Leave history'],
      },
      {
        id: 'attendance',
        title: 'Attendance Tracking',
        description: 'Digital attendance system with regularization support.',
        icon: 'clock',
        details: ['Check-in/out', 'Regularization requests', 'Team reports', 'Monthly summaries'],
      },
      {
        id: 'holidays',
        title: 'Holiday Calendar',
        description: 'Manage company holidays and special days.',
        icon: 'calendar-star',
        details: ['Public holidays', 'Company events', 'CSV import', 'Team visibility'],
      },
    ],
  },
  {
    id: 'project-management',
    title: 'Project Management',
    description: 'Powerful tools for managing projects and tasks',
    icon: 'folder',
    features: [
      {
        id: 'kanban',
        title: 'Kanban Boards',
        description: 'Visual task management with drag-and-drop functionality.',
        icon: 'columns',
        details: ['Drag-and-drop', 'Custom columns', 'Task priorities', 'Filters'],
      },
      {
        id: 'tasks',
        title: 'Task Assignment',
        description: 'Assign tasks to team members with deadlines and priorities.',
        icon: 'check-square',
        details: ['Role-based assignment', 'Due dates', 'Priority levels', 'Attachments'],
      },
      {
        id: 'clients',
        title: 'Client Management',
        description: 'Manage client information and project associations.',
        icon: 'briefcase',
        details: ['Client database', 'Project linking', 'Contact info', 'Activity history'],
      },
    ],
  },
  {
    id: 'daily-operations',
    title: 'Daily Operations',
    description: 'Tools for everyday productivity',
    icon: 'activity',
    features: [
      {
        id: 'reports',
        title: 'Daily Reporting',
        description: 'Track daily work with structured time entries.',
        icon: 'file-text',
        details: ['Time entries', 'Project tagging', 'Work summaries', 'Team visibility'],
      },
      {
        id: 'notifications',
        title: 'Real-time Notifications',
        description: 'Stay updated with instant in-app notifications.',
        icon: 'bell',
        details: ['Push notifications', 'Email alerts', 'In-app messages', 'Customizable'],
      },
      {
        id: 'dashboard',
        title: 'Smart Dashboard',
        description: 'Get insights with a personalized dashboard.',
        icon: 'layout',
        details: ['Key metrics', 'Upcoming events', 'Team birthdays', 'Quick actions'],
      },
    ],
  },
];

export const stats = [
  { value: '10,000+', label: 'Active Users' },
  { value: '500+', label: 'Companies' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
];

export const testimonials = [
  {
    id: '1',
    quote: 'This platform transformed how we manage our remote team. Leave requests and attendance tracking are now seamless.',
    author: 'Sarah Johnson',
    role: 'HR Director',
    company: 'TechStart Inc.',
  },
  {
    id: '2',
    quote: 'The Kanban board and task management features have improved our project delivery times significantly.',
    author: 'Michael Chen',
    role: 'Project Manager',
    company: 'Digital Solutions',
  },
  {
    id: '3',
    quote: 'Finally, a single platform for all our HR and project needs. The attendance and leave management saved us hours every month.',
    author: 'Emily Rodriguez',
    role: 'Operations Manager',
    company: 'Growth Partners',
  },
];

export const faqs = [
  {
    question: 'How do I get started with Arkera?',
    answer: 'Simply sign up for an account, configure your organization settings, and invite your team members. Our onboarding wizard will guide you through the initial setup.',
  },
  {
    question: 'Can I customize roles and permissions?',
    answer: 'Yes! We offer three default roles (Admin, Manager, Employee) with predefined permissions. Admins can customize what each role can access and manage.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use industry-standard encryption, secure authentication with JWT tokens, and role-based access control. All data is stored in encrypted databases with regular backups.',
  },
  {
    question: 'Do you offer integrations with other tools?',
    answer: 'We currently support email notifications via Gmail and AWS SES. We are actively working on integrations with popular chat platforms like WhatsApp, Telegram, and Google Chat.',
  },
  {
    question: 'What kind of support do you provide?',
    answer: 'We offer email support for all users, with priority support for enterprise customers. Our documentation and knowledge base are available 24/7.',
  },
];

export const steps = [
  {
    number: 1,
    title: 'Sign Up & Configure',
    description: 'Create your organization account and configure company settings, departments, and holiday calendar.',
    icon: 'settings',
  },
  {
    number: 2,
    title: 'Invite Your Team',
    description: 'Add team members, assign roles (Admin, Manager, Employee), and set up reporting structures.',
    icon: 'user-plus',
  },
  {
    number: 3,
    title: 'Start Managing',
    description: 'Begin tracking attendance, managing leaves, creating projects, and assigning tasks to your team.',
    icon: 'play',
  },
  {
    number: 4,
    title: 'Track & Improve',
    description: 'Use dashboards and reports to monitor team productivity, attendance patterns, and project progress.',
    icon: 'trending-up',
  },
];

export const roles = [
  {
    title: 'Admin',
    description: 'Full access to all features including user management and system configuration.',
    features: ['Manage all employees', 'Configure system settings', 'View all reports', 'Manage holidays', 'Full system access'],
  },
  {
    title: 'Manager',
    description: 'Team management capabilities with approval authority for leaves.',
    features: ['Approve team leaves', 'Manage team tasks', 'View team attendance', 'Create projects', 'View team reports'],
  },
  {
    title: 'Employee',
    description: 'Access to personal data, leave applications, and assigned tasks.',
    features: ['Apply for leaves', 'Mark attendance', 'Submit daily reports', 'Work on tasks', 'View personal data'],
  },
];
