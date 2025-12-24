import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Dashboard,
  EventAvailable,
  AccessTime,
  CalendarMonth,
  AccountCircle,
  Logout,
  Close,
  People,
  FolderOpen,
  DarkMode,
  LightMode,
  ChevronLeft,
  ChevronRight,
  Assignment,
  // Payments, // Hidden for now
  Business,
} from "@mui/icons-material";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "react-toastify";
// import logoImage from '@/assets/logo_1.png';

const SIDEBAR_EXPANDED_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 64;
const SIDEBAR_STATE_KEY = "app-sidebar-collapsed";

interface NavItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  roles?: string[];
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Workspace",
    items: [
      {
        text: "Dashboard",
        icon: <Dashboard />,
        path: "/",
      },
      {
        text: "Employees",
        icon: <People />,
        path: "/employees",
        roles: ["admin"],
      },
      {
        text: "Leaves",
        icon: <EventAvailable />,
        path: "/leaves",
      },
      {
        text: "Attendance",
        icon: <AccessTime />,
        path: "/attendance",
      },
      {
        text: "Projects",
        icon: <FolderOpen />,
        path: "/projects",
      },
      {
        text: "Daily Reports",
        icon: <Assignment />,
        path: "/daily-reports",
      },
      {
        text: "Holidays",
        icon: <CalendarMonth />,
        path: "/holidays",
      },
      // Payments hidden for now
      // {
      //   text: "Payments",
      //   icon: <Payments />,
      //   path: "/payments",
      // },
      {
        text: "Clients",
        icon: <Business />,
        path: "/clients",
        roles: ["admin", "manager"],
      },
    ],
  },
];

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
    return stored === "true";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed");
    }
    handleProfileMenuClose();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const getCurrentPageTitle = () => {
    for (const section of navSections) {
      const item = section.items.find((i) => i.path === location.pathname);
      if (item) return item.text;
    }
    if (location.pathname === "/profile") return "Profile";
    return "Dashboard";
  };

  const getCurrentPageIcon = () => {
    for (const section of navSections) {
      const item = section.items.find((i) => i.path === location.pathname);
      if (item) return item.icon;
    }
    if (location.pathname === "/profile") return <AccountCircle />;
    return <Dashboard />;
  };

  const sidebarWidth = sidebarCollapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : SIDEBAR_EXPANDED_WIDTH;

  const sidebar = (
    <div
      className="h-full flex flex-col transition-all duration-200"
      style={{
        backgroundColor: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        width: sidebarWidth,
      }}
    >
      {/* Logo Section */}
      <div
        className="h-14 flex items-center px-3 border-b"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-2 flex-1">
            {/*<img
              src={logoImage}
              alt="Company"
              style={{ height: 28, width: 'auto' }}
            />*/}
            <ChevronLeft
              className="ml-auto cursor-pointer"
              style={{ color: "var(--text-muted)", fontSize: 18 }}
              onClick={handleSidebarToggle}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <ChevronRight
              className="cursor-pointer"
              style={{ color: "var(--text-muted)", fontSize: 18 }}
              onClick={handleSidebarToggle}
            />
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto custom-scrollbar">
        {navSections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {/* Section Label */}
            {section.label && !sidebarCollapsed && (
              <div className="sidebar-section-label">{section.label}</div>
            )}

            {/* Section Items */}
            {section.items
              .filter(
                (item) => !item.roles || item.roles.includes(user?.role || ""),
              )
              .map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Tooltip
                    key={item.text}
                    title={sidebarCollapsed ? item.text : ""}
                    placement="right"
                    arrow
                  >
                    <div
                      onClick={() => handleNavigate(item.path)}
                      className={`
                        flex items-center gap-3 px-3 py-2 my-0.5 rounded-md cursor-pointer
                        transition-all duration-150
                        ${isActive ? "sidebar-item-active" : "sidebar-item"}
                      `}
                      style={
                        sidebarCollapsed
                          ? { justifyContent: "center", padding: "0.5rem" }
                          : {}
                      }
                    >
                      <div
                        className="flex items-center justify-center"
                        style={{
                          color: isActive
                            ? "var(--accent-primary)"
                            : "var(--text-secondary)",
                          minWidth: 20,
                        }}
                      >
                        {React.cloneElement(item.icon, {
                          sx: { fontSize: 20 },
                        })}
                      </div>
                      {!sidebarCollapsed && (
                        <span
                          className="text-sm font-medium truncate"
                          style={{
                            color: isActive
                              ? "var(--accent-primary)"
                              : "var(--text-secondary)",
                          }}
                        >
                          {item.text}
                        </span>
                      )}
                    </div>
                  </Tooltip>
                );
              })}

            {/* Divider between sections */}
            {sectionIdx < navSections.length - 1 && (
              <div
                className="my-2 mx-3 border-b"
                style={{ borderColor: "var(--sidebar-border)" }}
              />
            )}
          </div>
        ))}
      </nav>

      {/* User Info at Bottom */}
      <div
        className="p-2 border-t"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        {!sidebarCollapsed ? (
          <div
            className="flex items-center gap-3 p-2 rounded-lg"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border)",
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                fontSize: "14px",
                fontWeight: 600,
                bgcolor: "var(--accent-primary)",
              }}
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.firstName} {user?.lastName}
              </p>
              <p
                className="text-xs capitalize truncate"
                style={{ color: "var(--text-muted)" }}
              >
                {user?.role}
              </p>
            </div>
          </div>
        ) : (
          <Tooltip
            title={`${user?.firstName} ${user?.lastName} (${user?.role})`}
            placement="right"
            arrow
          >
            <div
              className="flex justify-center p-1 rounded-lg"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: "12px",
                  fontWeight: 600,
                  bgcolor: "var(--accent-primary)",
                }}
              >
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Avatar>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={handleDrawerToggle}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className="hidden lg:block fixed left-0 top-0 h-screen z-30 transition-all duration-200"
        style={{ width: sidebarWidth }}
      >
        {sidebar}
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`
          lg:hidden fixed left-0 top-0 h-screen z-50 transform transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ width: SIDEBAR_EXPANDED_WIDTH }}
      >
        <div
          className="h-full flex flex-col"
          style={{
            backgroundColor: "var(--sidebar-bg)",
            borderRight: "1px solid var(--sidebar-border)",
          }}
        >
          {/* Mobile close button */}
          <div className="absolute top-4 right-4">
            <IconButton size="small" onClick={handleDrawerToggle}>
              <Close sx={{ color: "var(--text-secondary)" }} />
            </IconButton>
          </div>
          {React.cloneElement(sidebar as React.ReactElement, {})}
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Header */}
        <header
          className="h-14 flex items-center px-4 sticky top-0 z-20 border-b"
          style={{
            backgroundColor: "var(--header-bg)",
            borderColor: "var(--header-border)",
          }}
        >
          {/* Page Title */}
          <div className="flex items-center gap-2 flex-1">
            <div
              className="flex items-center justify-center"
              style={{ color: "var(--text-muted)" }}
            >
              {React.cloneElement(getCurrentPageIcon(), {
                sx: { fontSize: 20, display: "block" },
              })}
            </div>
            <span
              className="text-sm font-medium leading-none"
              style={{ color: "var(--text-primary)" }}
            >
              {getCurrentPageTitle()}
            </span>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-1">
            {/* Theme Toggle */}
            <Tooltip title={theme === "dark" ? "Light mode" : "Dark mode"}>
              <IconButton size="small" onClick={toggleTheme}>
                {theme === "dark" ? (
                  <LightMode sx={{ fontSize: 20 }} />
                ) : (
                  <DarkMode sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <Tooltip title="Account">
              <div
                onClick={handleProfileMenuOpen}
                className="cursor-pointer ml-2"
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </Avatar>
              </div>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              PaperProps={{
                elevation: 0,
                sx: {
                  mt: 1,
                  minWidth: 180,
                },
              }}
            >
              <div
                className="px-4 py-2 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {user?.email}
                </p>
              </div>
              <MenuItem
                onClick={() => {
                  handleNavigate("/profile");
                  handleProfileMenuClose();
                }}
                sx={{ gap: 1.5, py: 1 }}
              >
                <AccountCircle fontSize="small" />
                <span className="text-sm">Profile</span>
              </MenuItem>
              <MenuItem
                onClick={handleLogout}
                sx={{ gap: 1.5, py: 1, color: "var(--accent-error)" }}
              >
                <Logout fontSize="small" />
                <span className="text-sm">Logout</span>
              </MenuItem>
            </Menu>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 p-6 overflow-y-auto custom-scrollbar"
          style={{ backgroundColor: "var(--bg-primary)" }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
