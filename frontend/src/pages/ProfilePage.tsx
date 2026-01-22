import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Lock,
  Email,
  Phone,
  CalendarMonth,
  Business,
  Person,
  LocationOn,
  People,
  ChevronRight,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import type { ChangePasswordData } from '@/types';

const changePasswordSchema = yup.object().shape({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordData>({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleChangePassword = async (data: ChangePasswordData) => {
    try {
      setSubmitting(true);
      await authService.changePassword(data);
      toast.success('Password changed successfully');
      setOpenPasswordDialog(false);
      reset();
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: 'primary.main',
                    fontSize: 48,
                    mb: 2,
                  }}
                >
                  {user.firstName[0]}
                  {user.lastName[0]}
                </Avatar>

                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {user.firstName} {user.lastName}
                </Typography>

                <Chip
                  label={user.role}
                  color="primary"
                  sx={{ textTransform: 'capitalize', mb: 2 }}
                />

                <Chip
                  label={user.status}
                  color={user.status === 'active' ? 'success' : 'default'}
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />

                <Button
                  variant="outlined"
                  startIcon={<Lock />}
                  onClick={() => setOpenPasswordDialog(true)}
                  sx={{ mt: 3 }}
                  fullWidth
                >
                  Change Password
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Personal Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Email fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Email Address
                    </Typography>
                  </Box>
                  <Typography variant="body1">{user.email}</Typography>
                </Grid>

                {user.phone && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Phone fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Phone Number
                      </Typography>
                    </Box>
                    <Typography variant="body1">{user.phone}</Typography>
                  </Grid>
                )}

                {user.dateOfBirth && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <CalendarMonth fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Date of Birth
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {format(new Date(user.dateOfBirth), 'MMMM dd, yyyy')}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CalendarMonth fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Date of Joining
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {format(new Date(user.dateOfJoining), 'MMMM dd, yyyy')}
                  </Typography>
                </Grid>

                {user.department && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Business fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Department
                      </Typography>
                    </Box>
                    <Typography variant="body1">{user.department.name}</Typography>
                  </Grid>
                )}

                {user.manager && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Reporting Manager
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {user.manager.firstName} {user.manager.lastName}
                    </Typography>
                  </Grid>
                )}

                {user.address && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Address
                      </Typography>
                    </Box>
                    <Typography variant="body1">{user.address}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {(user.emergencyContactName || user.emergencyContactPhone) && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Emergency Contact
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  {user.emergencyContactName && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Contact Name
                        </Typography>
                      </Box>
                      <Typography variant="body1">
                        {user.emergencyContactName}
                      </Typography>
                    </Grid>
                  )}

                  {user.emergencyContactPhone && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Phone fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Contact Phone
                        </Typography>
                      </Box>
                      <Typography variant="body1">
                        {user.emergencyContactPhone}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Management Section */}
        {(isAdmin || isManager) && (
          <Grid item xs={12}>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Management
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  {isAdmin && (
                    <Grid item xs={12} sm={4}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'action.hover',
                          },
                        }}
                        onClick={() => navigate('/employees')}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap={2}>
                              <People color="primary" />
                              <Box>
                                <Typography variant="subtitle1" fontWeight="medium">
                                  Employees
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Manage team members
                                </Typography>
                              </Box>
                            </Box>
                            <ChevronRight color="action" />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  <Grid item xs={12} sm={4}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover',
                        },
                      }}
                      onClick={() => navigate('/holidays')}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={2}>
                            <CalendarMonth color="primary" />
                            <Box>
                              <Typography variant="subtitle1" fontWeight="medium">
                                Holidays
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                View holiday calendar
                              </Typography>
                            </Box>
                          </Box>
                          <ChevronRight color="action" />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover',
                        },
                      }}
                      onClick={() => navigate('/clients')}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={2}>
                            <Business color="primary" />
                            <Box>
                              <Typography variant="subtitle1" fontWeight="medium">
                                Clients
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Manage clients
                              </Typography>
                            </Box>
                          </Box>
                          <ChevronRight color="action" />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Holidays Card - visible to all employees */}
        {!isAdmin && !isManager && (
          <Grid item xs={12}>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Quick Links
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover',
                        },
                      }}
                      onClick={() => navigate('/holidays')}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={2}>
                            <CalendarMonth color="primary" />
                            <Box>
                              <Typography variant="subtitle1" fontWeight="medium">
                                Holidays
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                View holiday calendar
                              </Typography>
                            </Box>
                          </Box>
                          <ChevronRight color="action" />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Change Password Dialog */}
      <Dialog
        open={openPasswordDialog}
        onClose={() => !submitting && setOpenPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <form onSubmit={handleSubmit(handleChangePassword)}>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Password must be at least 8 characters and contain uppercase, lowercase,
              number and special character.
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="currentPassword"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="password"
                      label="Current Password"
                      error={!!errors.currentPassword}
                      helperText={errors.currentPassword?.message}
                      disabled={submitting}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="newPassword"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="password"
                      label="New Password"
                      error={!!errors.newPassword}
                      helperText={errors.newPassword?.message}
                      disabled={submitting}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="password"
                      label="Confirm New Password"
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                      disabled={submitting}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPasswordDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : 'Change Password'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;
