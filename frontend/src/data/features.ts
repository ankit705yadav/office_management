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
    description: 'Simplify leave requests, track attendance accurately, and manage employee information in one place.',
    icon: 'users',
    details: ['Leave Management', 'Attendance Tracking', 'Holiday Calendar'],
  },
  {
    id: 'projects',
    title: 'Project Management',
    description: 'Organize tasks using Kanban boards, assign work clearly, and track progress in real time with full visibility.',
    icon: 'kanban',
    details: ['Kanban Boards', 'Task Assignment', 'Progress Tracking'],
  },
  {
    id: 'attendance',
    title: 'Smart Attendance',
    description: 'Digital check-in and check-out with regularization requests and insights.',
    icon: 'clock',
    details: ['Check-in/Check-out', 'Regularization', 'Team Reports'],
  },
  {
    id: 'reports',
    title: 'Daily Reports',
    description: 'Capture daily work through structured entries with complete team transparency',
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
    description: 'End-to-end human resource management solution',
    icon: 'users',
    features: [
      {
        id: 'leave',
        title: 'Leave Management',
        description: 'Simplified leave applications with multi-level approval workflows.',
        icon: 'calendar',
        details: ['Multiple leave types', 'Balance tracking', 'Multi-level approval', 'Leave history'],
      },
      {
        id: 'attendance',
        title: 'Attendance Tracking',
        description: 'Smart digital attendance tracking with built-in regularization support',
        icon: 'clock',
        details: ['Check-in/out', 'Regularization requests', 'Team reports', 'Monthly summaries'],
      },
      {
        id: 'holidays',
        title: 'Holiday Calendar',
        description: 'Manage company holidays and important occasions effortlessly',
        icon: 'calendar-star',
        details: ['Public holidays', 'Company events', 'CSV import', 'Team visibility'],
      },
    ],
  },
  {
    id: 'project-management',
    title: 'Project Management',
    description: 'Powerful tools for organizing projects and managing tasks.',
    icon: 'folder',
    features: [
      {
        id: 'kanban',
        title: 'Kanban Boards',
        description: 'Visual task management using simple drag-and-drop interactions.',
        icon: 'columns',
        details: ['Drag-and-drop', 'Custom columns', 'Task priorities', 'Filters'],
      },
      {
        id: 'tasks',
        title: 'Task Assignment',
        description: 'Assign tasks to team members with clear deadlines and defined priorities.',
        icon: 'check-square',
        details: ['Role-based assignment', 'Due dates', 'Priority levels', 'Attachments'],
      },
      {
        id: 'clients',
        title: 'Client Management',
        description: 'Manage client details and link them directly to projects',
        icon: 'briefcase',
        details: ['Client database', 'Project linking', 'Contact info', 'Activity history'],
      },
    ],
  },
  {
    id: 'daily-operations',
    title: 'Daily Operations',
    description: 'Tools designed to boost everyday productivity',
    icon: 'activity',
    features: [
      {
        id: 'reports',
        title: 'Daily Reporting',
        description: 'Track daily work using clear, structured time entries.',
        icon: 'file-text',
        details: ['Time entries', 'Project tagging', 'Work summaries', 'Team visibility'],
      },
      {
        id: 'notifications',
        title: 'Real-time Notifications',
        description: 'Stay informed through instant in-app notifications.',
        icon: 'bell',
        details: ['Push notifications', 'Email alerts', 'In-app messages', 'Customizable'],
      },
      {
        id: 'dashboard',
        title: 'Smart Dashboard',
        description: 'Get insights through a personalized dashboard.',
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
    answer: 'Sign up for an account, set up your organization details, and invite your team. Our onboarding wizard guides you step by step, making the initial setup quick and easy.',
  },
  {
    question: 'Can I customize roles and permissions?',
    answer: 'Yes. Arkera includes three default roles: Admin, Manager, and Employee, with predefined permissions. Admins can easily customize access levels and control what each role can view or manage.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. Arkera uses industry-standard encryption, secure JWT-based authentication, and strict role-based access control. All data is stored in encrypted databases with regular, automated backups to ensure security and reliability.',
  },
  {
    question: 'Do you offer integrations with other tools?',
    answer: 'Currently, Arkera supports email notifications through Gmail and AWS SES. We’re actively working on integrations with popular chat platforms such as WhatsApp, Telegram, and Google Chat to expand notification options.',
  },
  {
    question: 'What kind of support do you provide?',
    answer: 'Arkera offers email support for all users, along with priority assistance for enterprise customers. Our documentation and knowledge base are available 24/7 for quick, self-service help.',
  },
];

export const steps = [
  {
    number: 1,
    title: 'Sign Up & Configure',
    description: 'Create your organization account and set up company settings, departments, and the holiday calendar.',
    icon: 'settings',
  },
  {
    number: 2,
    title: 'Invite Your Team',
    description: 'Add team members, assign roles such as Admin, Manager, or Employee, and configure reporting structures.',
    icon: 'user-plus',
  },
  {
    number: 3,
    title: 'Start Managing',
    description: 'Start tracking attendance, managing leaves, creating projects, and assigning tasks across your team.',
    icon: 'play',
  },
  {
    number: 4,
    title: 'Track & Improve',
    description: 'Use dashboards and reports to track team productivity, attendance trends, and overall project progress.',
    icon: 'trending-up',
  },
];

export const roles = [
  {
    title: 'Admin',
    description: 'Full access to every feature, including user control and system setup.',
    features: ['Manage all employees', 'Configure platform settings', 'Access complete reports', 'Manage company holidays', 'Full system control'],
  },
  {
    title: 'Manager',
    description: 'Team management tools with approval control and clear oversight.',
    features: ['Approve team leave requests', 'Manage assigned tasks', 'Monitor team attendance', 'Create and oversee projects', 'Access team-level reports'],
  },
  {
    title: 'Employee',
    description: 'Access to personal information, leave requests, and assigned work.',
    features: ['Apply for leaves', 'Mark attendance', 'Submit daily reports', 'Work on assigned tasks', 'View personal details'],
  },
];
