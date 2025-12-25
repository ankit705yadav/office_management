import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/utils/render';
import LoginPage from '../LoginPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderLoginPage = () => {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </ThemeProvider>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the login form', () => {
      renderLoginPage();

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your.email@company.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders quick login buttons', () => {
      renderLoginPage();

      expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /manager/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /employee/i })).toBeInTheDocument();
    });

    it('renders theme toggle button', () => {
      renderLoginPage();

      // Find the theme toggle button (it's an IconButton)
      const themeButtons = screen.getAllByRole('button');
      const themeToggle = themeButtons.find(btn =>
        btn.querySelector('[data-testid="DarkModeIcon"]') ||
        btn.querySelector('[data-testid="LightModeIcon"]')
      );

      expect(themeToggle).toBeDefined();
    });
  });

  describe('form validation', () => {
    it('shows error for empty email', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
      });
    });

    it('shows error for short password', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      await user.type(emailInput, 'test@test.com');
      await user.type(passwordInput, 'short');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });
  });

  describe('password visibility toggle', () => {
    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find and click the visibility toggle button
      const visibilityButtons = screen.getAllByRole('button');
      const toggleButton = visibilityButtons.find(btn =>
        btn.querySelector('[data-testid="VisibilityIcon"]') ||
        btn.querySelector('[data-testid="VisibilityOffIcon"]')
      );

      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });
  });

  describe('form submission', () => {
    it('submits with valid credentials', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      await user.type(emailInput, 'employee@test.com');
      await user.type(passwordInput, 'Employee@123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // The form should submit and login should be called
      // Since we're using MSW, this should succeed
      await waitFor(() => {
        // After successful login, tokens should be stored
        expect(localStorage.getItem('accessToken')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('disables form while loading', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      await user.type(emailInput, 'employee@test.com');
      await user.type(passwordInput, 'Employee@123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Button should be disabled during loading
      expect(submitButton).toBeDisabled();
    });
  });
});
