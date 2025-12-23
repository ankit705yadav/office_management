import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { CalendarMonth, Event, ChevronLeft, ChevronRight, Add, Delete } from '@mui/icons-material';
import {
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { holidayService, CreateHolidayData } from '@/services/holiday.service';
import type { Holiday } from '@/types';

const holidaySchema = yup.object().shape({
  name: yup.string().required('Holiday name is required').min(3, 'Name must be at least 3 characters'),
  date: yup.string().required('Date is required'),
  description: yup.string(),
  isOptional: yup.boolean().required(),
});

const HolidaysPage: React.FC = () => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateHolidayData>({
    resolver: yupResolver(holidaySchema),
    defaultValues: {
      name: '',
      date: '',
      description: '',
      isOptional: false,
    },
  });

  useEffect(() => {
    loadHolidays();
  }, [selectedYear]);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await holidayService.getHolidays({ year: selectedYear });
      setHolidays(data);
    } catch (err) {
      setError('Failed to load holidays');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getHolidayForDate = (date: Date): Holiday | undefined => {
    return holidays.find((holiday) => isSameDay(parseISO(holiday.date), date));
  };

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleCreateHoliday = async (data: CreateHolidayData) => {
    try {
      setSubmitting(true);
      const year = new Date(data.date).getFullYear();
      await holidayService.createHoliday({ ...data, year });
      toast.success('Holiday created successfully');
      setOpenCreateDialog(false);
      reset();
      loadHolidays();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to create holiday';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (holiday: Holiday) => {
    if (!window.confirm(`Are you sure you want to delete "${holiday.name}"?`)) {
      return;
    }

    try {
      await holidayService.deleteHoliday(holiday.id);
      toast.success('Holiday deleted successfully');
      loadHolidays();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to delete holiday';
      toast.error(errorMessage);
    }
  };

  const isAdmin = user?.role === 'admin';

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 1);

  const totalHolidays = holidays.length;
  const mandatoryHolidays = holidays.filter((h) => !h.isOptional).length;
  const optionalHolidays = holidays.filter((h) => h.isOptional).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--accent-primary)' }}>
          Holiday Calendar
        </Typography>

        <Box display="flex" gap={2} alignItems="center">
          <FormControl
            sx={{
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                color: 'var(--text-primary)',
                '& fieldset': { borderColor: 'var(--border)' },
                '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
                '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
              },
              '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
              '& .MuiInputLabel-root.Mui-focused': { color: 'var(--accent-primary)' },
              '& .MuiSelect-icon': { color: 'var(--text-secondary)' },
            }}
          >
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              label="Year"
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    '& .MuiMenuItem-root': {
                      color: 'var(--text-primary)',
                      '&:hover': { bgcolor: 'var(--bg-elevated)' },
                      '&.Mui-selected': { bgcolor: 'var(--bg-elevated)' },
                    },
                  },
                },
              }}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenCreateDialog(true)}
              sx={{ bgcolor: 'var(--accent-primary)', color: '#ffffff', '&:hover': { bgcolor: 'var(--accent-hover)' } }}
            >
              Add Holiday
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box display="flex" gap={2} mb={2}>
        <Card sx={{ flex: 1, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <CalendarMonth sx={{ fontSize: 28, color: '#3d9be9' }} />
              <Box>
                <Typography variant="h5" fontWeight="bold" lineHeight={1.2} sx={{ color: 'var(--text-primary)' }}>
                  {totalHolidays}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                  Total Holidays
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Event sx={{ fontSize: 28, color: '#10B981' }} />
              <Box>
                <Typography variant="h5" fontWeight="bold" lineHeight={1.2} sx={{ color: 'var(--text-primary)' }}>
                  {mandatoryHolidays}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                  Mandatory Holidays
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Event sx={{ fontSize: 28, color: '#3d9be9' }} />
              <Box>
                <Typography variant="h5" fontWeight="bold" lineHeight={1.2} sx={{ color: 'var(--text-primary)' }}>
                  {optionalHolidays}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                  Optional Holidays
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Calendar View and Current Month Holidays */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Calendar - Left Half */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <CardContent sx={{ py: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <IconButton onClick={handlePrevMonth} size="small" sx={{ color: 'var(--text-secondary)', '&:hover': { color: 'var(--text-primary)' } }}>
                  <ChevronLeft />
                </IconButton>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'var(--accent-primary)' }}>
                  {format(currentMonth, 'MMMM yyyy')}
                </Typography>
                <IconButton onClick={handleNextMonth} size="small" sx={{ color: 'var(--text-secondary)', '&:hover': { color: 'var(--text-primary)' } }}>
                  <ChevronRight />
                </IconButton>
              </Box>

          {/* Legend */}
          <Box display="flex" gap={2} mb={1.5} justifyContent="center" flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: '#10B981',
                  border: '1px solid',
                  borderColor: '#10B981',
                  borderRadius: 0.5,
                }}
              />
              <Typography variant="caption" fontSize="0.7rem" sx={{ color: 'var(--text-secondary)' }}>Mandatory Holiday</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: '#3d9be9',
                  border: '1px solid',
                  borderColor: '#3d9be9',
                  borderRadius: 0.5,
                }}
              />
              <Typography variant="caption" fontSize="0.7rem" sx={{ color: 'var(--text-secondary)' }}>Optional Holiday</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: '#3d9be9',
                  border: '2px solid',
                  borderColor: '#3d9be9',
                  borderRadius: 0.5,
                }}
              />
              <Typography variant="caption" fontSize="0.7rem" sx={{ color: 'var(--text-secondary)' }}>Today</Typography>
            </Box>
          </Box>

          {/* Calendar Grid */}
          <Box>
            {/* Weekday Headers */}
            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.5} mb={0.5}>
              {weekDays.map((day) => (
                <Box
                  key={day}
                  sx={{
                    textAlign: 'center',
                    py: 0.5,
                    fontWeight: 'bold',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                  }}
                >
                  {day}
                </Box>
              ))}
            </Box>

            {/* Calendar Days */}
            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.5}>
              {generateCalendarDays().map((day, index) => {
                const holiday = getHolidayForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());

                return (
                  <Tooltip
                    key={index}
                    title={holiday ? `${holiday.name}${holiday.isOptional ? ' (Optional)' : ''}` : ''}
                    arrow
                  >
                    <Paper
                      elevation={holiday ? 2 : 0}
                      sx={{
                        minHeight: 60,
                        maxHeight: 60,
                        p: 0.75,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundImage: 'none !important',
                        bgcolor: holiday
                          ? holiday.isOptional
                            ? '#3d9be9 !important'
                            : '#10B981 !important'
                          : isToday
                          ? '#3d9be9 !important'
                          : 'var(--bg-elevated)',
                        opacity: isCurrentMonth ? 1 : 0.3,
                        border: isToday ? '2px solid' : '1px solid',
                        borderColor: isToday
                          ? '#3d9be9'
                          : holiday
                          ? holiday.isOptional
                            ? '#3d9be9'
                            : '#10B981'
                          : 'var(--border)',
                        cursor: holiday ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        '&:hover': holiday
                          ? {
                              transform: 'translateY(-2px)',
                              boxShadow: 3,
                            }
                          : {},
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={isToday ? 'bold' : 'normal'}
                        sx={{ mb: holiday ? 0.25 : 0, fontSize: '0.75rem', color: holiday || isToday ? 'white' : 'var(--text-primary)' }}
                      >
                        {format(day, 'd')}
                      </Typography>
                      {holiday && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.6rem',
                            color: 'white',
                            fontWeight: 500,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.2,
                            wordBreak: 'break-word',
                          }}
                        >
                          {holiday.name}
                        </Typography>
                      )}
                    </Paper>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Month Holidays - Right Half */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'var(--accent-primary)' }}>
                Holidays in {format(currentMonth, 'MMMM yyyy')}
              </Typography>

              <Paper variant="outlined" sx={{ mt: 2, maxHeight: 560, overflow: 'auto', bgcolor: 'var(--bg-elevated)', borderColor: 'var(--border)', backgroundImage: 'none' }}>
                <List dense>
                  {holidays
                    .filter(holiday => isSameMonth(parseISO(holiday.date), currentMonth))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .length === 0 ? (
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography sx={{ color: 'var(--text-secondary)' }} align="center" py={2}>
                            No holidays in this month
                          </Typography>
                        }
                      />
                    </ListItem>
                  ) : (
                    holidays
                      .filter(holiday => isSameMonth(parseISO(holiday.date), currentMonth))
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((holiday, index, array) => (
                        <ListItem
                          key={holiday.id}
                          sx={{
                            borderBottom: index < array.length - 1 ? '1px solid' : 'none',
                            borderColor: 'var(--border)',
                            py: 1.5,
                          }}
                          secondaryAction={
                            isAdmin ? (
                              <Tooltip title="Delete Holiday">
                                <IconButton
                                  edge="end"
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteHoliday(holiday)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : null
                          }
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Event
                              color={holiday.isOptional ? 'info' : 'success'}
                              fontSize="medium"
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box component="span" display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                <Typography component="span" variant="body1" fontWeight="medium" sx={{ color: 'var(--text-primary)' }}>
                                  {holiday.name}
                                </Typography>
                                {holiday.isOptional && (
                                  <Chip
                                    label="Optional"
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box component="span" display="block">
                                <Typography component="span" variant="body2" sx={{ color: '#3d9be9', fontWeight: 'medium' }}>
                                  {format(parseISO(holiday.date), 'EEEE, MMMM dd')}
                                </Typography>
                                {holiday.description && (
                                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }} display="block">
                                    {holiday.description}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))
                  )}
                </List>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* All Holidays List */}
      <Card sx={{ mt: 3, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ color: 'var(--accent-primary)' }}>
            Complete Holiday List {selectedYear}
          </Typography>

          <Paper variant="outlined" sx={{ mt: 2, bgcolor: 'var(--bg-elevated)', borderColor: 'var(--border)', backgroundImage: 'none' }}>
            <List>
              {holidays.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography sx={{ color: 'var(--text-secondary)' }} align="center">
                        No holidays found for {selectedYear}
                      </Typography>
                    }
                  />
                </ListItem>
              ) : (
                holidays.map((holiday, index) => (
                  <ListItem
                    key={holiday.id}
                    sx={{
                      borderBottom:
                        index < holidays.length - 1 ? '1px solid' : 'none',
                      borderColor: 'var(--border)',
                    }}
                    secondaryAction={
                      isAdmin ? (
                        <Tooltip title="Delete Holiday">
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => handleDeleteHoliday(holiday)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      ) : null
                    }
                  >
                    <ListItemIcon>
                      <Event sx={{ color: holiday.isOptional ? '#3d9be9' : '#10B981' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box component="span" display="flex" alignItems="center" gap={1}>
                          <Typography component="span" variant="body1" fontWeight="medium" sx={{ color: 'var(--text-primary)' }}>
                            {holiday.name}
                          </Typography>
                          {holiday.isOptional && (
                            <Chip
                              label="Optional"
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box component="span" display="block">
                          <Typography component="span" variant="body2" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
                            {format(parseISO(holiday.date), 'EEEE, MMMM dd, yyyy')}
                          </Typography>
                          {holiday.description && (
                            <Typography component="span" variant="body2" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
                              {holiday.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </CardContent>
      </Card>

      {/* Create Holiday Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => !submitting && setOpenCreateDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'var(--surface)', border: '1px solid var(--border)' } }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Add New Holiday</DialogTitle>
        <form onSubmit={handleSubmit(handleCreateHoliday)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Holiday Name"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      disabled={submitting}
                      placeholder="e.g., Independence Day"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'var(--text-primary)',
                          '& fieldset': { borderColor: 'var(--text-secondary)' },
                          '&:hover fieldset': { borderColor: 'var(--text-primary)' },
                          '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                        },
                        '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                        '& .MuiInputLabel-root.Mui-focused': { color: 'var(--accent-primary)' },
                        '& .MuiOutlinedInput-input::placeholder': { color: 'var(--text-muted)', opacity: 1 },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.date}
                      helperText={errors.date?.message}
                      disabled={submitting}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'var(--text-primary)',
                          '& fieldset': { borderColor: 'var(--text-secondary)' },
                          '&:hover fieldset': { borderColor: 'var(--text-primary)' },
                          '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                        },
                        '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                        '& .MuiInputLabel-root.Mui-focused': { color: 'var(--accent-primary)' },
                        '& input[type="date"]::-webkit-calendar-picker-indicator': {
                          filter: 'invert(1)',
                          cursor: 'pointer',
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={2}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      disabled={submitting}
                      placeholder="Brief description of the holiday (optional)"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'var(--text-primary)',
                          '& fieldset': { borderColor: 'var(--text-secondary)' },
                          '&:hover fieldset': { borderColor: 'var(--text-primary)' },
                          '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                        },
                        '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                        '& .MuiInputLabel-root.Mui-focused': { color: 'var(--accent-primary)' },
                        '& .MuiOutlinedInput-input::placeholder': { color: 'var(--text-muted)', opacity: 1 },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="isOptional"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          disabled={submitting}
                          sx={{
                            '& .MuiSwitch-switchBase': {
                              color: '#fff',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: 'var(--accent-primary)',
                            },
                            '& .MuiSwitch-track': {
                              bgcolor: 'var(--text-secondary)',
                              opacity: 1,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              bgcolor: 'var(--accent-primary)',
                              opacity: 0.5,
                            },
                          }}
                        />
                      }
                      label="Optional Holiday"
                      sx={{ color: 'var(--text-primary)' }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid var(--border)', px: 3, py: 2 }}>
            <Button onClick={() => setOpenCreateDialog(false)} disabled={submitting} sx={{ color: 'var(--text-secondary)' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Create Holiday'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HolidaysPage;
