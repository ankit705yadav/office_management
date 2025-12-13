import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { CircularProgress, IconButton } from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  DarkMode,
  LightMode,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LoginCredentials } from "@/types";
// import logoImage from '@/assets/logo_1.png';

// Validation schema
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email("Please enter a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data);
      toast.success("Login successful! Welcome back.");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 transition-colors duration-200"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4">
        <IconButton
          onClick={toggleTheme}
          size="small"
          sx={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            "&:hover": { backgroundColor: "var(--sidebar-item-hover)" },
          }}
        >
          {theme === "dark" ? (
            <LightMode sx={{ fontSize: 20, color: "var(--text-secondary)" }} />
          ) : (
            <DarkMode sx={{ fontSize: 20, color: "var(--text-secondary)" }} />
          )}
        </IconButton>
      </div>

      <div className="w-full max-w-md">
        <div
          className="rounded-xl p-8 fade-in"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              {/*<img
                src={logoImage}
                alt="Elisrun"
                style={{ height: 48, width: 'auto' }}
              />*/}
            </div>
            <h1
              className="text-2xl font-semibold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Welcome back
            </h1>
            <p style={{ color: "var(--text-secondary)" }} className="text-sm">
              Sign in to your account to continue
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div
                className="px-4 py-3 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--accent-error-light)",
                  color: "var(--accent-error)",
                  border: "1px solid var(--accent-error)",
                }}
              >
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Email Address
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <div
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Email sx={{ fontSize: 20 }} />
                    </div>
                    <input
                      {...field}
                      type="email"
                      placeholder="your.email@company.com"
                      disabled={isLoading}
                      className="custom-input pl-11"
                      style={{
                        borderColor: errors.email
                          ? "var(--accent-error)"
                          : undefined,
                      }}
                    />
                  </div>
                )}
              />
              {errors.email && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--accent-error)" }}
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Password
              </label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <div
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Lock sx={{ fontSize: 20 }} />
                    </div>
                    <input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      disabled={isLoading}
                      className="custom-input pl-11 pr-11"
                      style={{
                        borderColor: errors.password
                          ? "var(--accent-error)"
                          : undefined,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {showPassword ? (
                        <VisibilityOff sx={{ fontSize: 20 }} />
                      ) : (
                        <Visibility sx={{ fontSize: 20 }} />
                      )}
                    </button>
                  </div>
                )}
              />
              {errors.password && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--accent-error)" }}
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center"
            >
              {isLoading ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Default Credentials Info */}
          <div
            className="mt-6 pt-6"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <p
              className="text-xs font-medium text-center mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Demo Credentials
            </p>
            <div className="space-y-2">
              {/* Admin */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                style={{ backgroundColor: "var(--bg-elevated)" }}
              >
                <span
                  className="font-medium px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: "var(--accent-error-light)",
                    color: "var(--accent-error)",
                  }}
                >
                  Admin
                </span>
                <span style={{ color: "var(--text-secondary)" }}>
                  admin@elisrun.com / Admin@123
                </span>
              </div>

              {/* Manager */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                style={{ backgroundColor: "var(--bg-elevated)" }}
              >
                <span
                  className="font-medium px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: "var(--accent-warning-light)",
                    color: "var(--accent-warning)",
                  }}
                >
                  Manager
                </span>
                <span style={{ color: "var(--text-secondary)" }}>
                  john.manager@elisrun.com / Password@123
                </span>
              </div>

              {/* Employee */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                style={{ backgroundColor: "var(--bg-elevated)" }}
              >
                <span
                  className="font-medium px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: "var(--accent-success-light)",
                    color: "var(--accent-success)",
                  }}
                >
                  Employee
                </span>
                <span style={{ color: "var(--text-secondary)" }}>
                  alice.dev@elisrun.com / Password@123
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p
            className="text-xs text-center mt-6"
            style={{ color: "var(--text-muted)" }}
          >
            © {new Date().getFullYear()} Operation Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
