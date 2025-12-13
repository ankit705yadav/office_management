import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import { ChevronLeft, ChevronRight, Circle } from '@mui/icons-material';
import { leaveService } from '@/services/leave.service';
import { holidayService } from '@/services/holiday.service';
import type { LeaveRequest, Holiday } from '@/types';

interface CalendarEvent {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'holiday' | 'leave';
  status?: string;
  isOptional?: boolean;
}

const LeaveCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, [currentMonth]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();

      const [leavesResponse, holidays] = await Promise.all([
        leaveService.getLeaveRequests({ limit: 100 }),
        holidayService.getHolidays({ year }),
      ]);

      const calendarEvents: CalendarEvent[] = [];

      // Add holidays
      holidays.forEach((holiday: Holiday) => {
        calendarEvents.push({
          id: holiday.id,
          title: holiday.name,
          startDate: parseISO(holiday.date),
          endDate: parseISO(holiday.date),
          type: 'holiday',
          isOptional: holiday.isOptional,
        });
      });

      // Add leaves
      leavesResponse.items.forEach((leave: LeaveRequest) => {
        if (leave.status !== 'cancelled') {
          calendarEvents.push({
            id: leave.id,
            title: `${leave.leaveType.replace('_', ' ')}`,
            startDate: parseISO(leave.startDate),
            endDate: parseISO(leave.endDate),
            type: 'leave',
            status: leave.status,
          });
        }
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter((event) => {
      if (isSameDay(event.startDate, date)) return true;
      if (isSameDay(event.endDate, date)) return true;
      if (
        isWithinInterval(date, {
          start: event.startDate,
          end: event.endDate,
        })
      )
        return true;
      return false;
    });
  };

  const getEventColor = (event: CalendarEvent): string => {
    if (event.type === 'holiday') {
      return event.isOptional ? '#F59E0B' : '#EF4444';
    }
    // Leave status colors
    switch (event.status) {
      case 'approved':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <h3
        className="text-lg font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        {format(currentMonth, 'MMMM yyyy')}
      </h3>
      <div className="flex items-center gap-1">
        <IconButton
          size="small"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          sx={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => setCurrentMonth(new Date())}
          sx={{ color: 'var(--accent-primary)', fontSize: '12px' }}
        >
          Today
        </IconButton>
        <IconButton
          size="small"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          sx={{ color: 'var(--text-secondary)' }}
        >
          <ChevronRight />
        </IconButton>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold py-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayEvents = getEventsForDate(day);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());
        const isSelected = selectedDate && isSameDay(day, selectedDate);

        days.push(
          <div
            key={day.toString()}
            className="min-h-[60px] p-1 cursor-pointer transition-colors"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: !isCurrentMonth
                ? 'var(--bg-elevated)'
                : isSelected
                ? 'rgba(241, 78, 30, 0.1)'
                : 'var(--surface)',
              opacity: !isCurrentMonth ? 0.5 : 1,
              borderColor: isToday ? 'var(--accent-primary)' : 'var(--border)',
            }}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <div
              className="text-xs font-medium mb-1"
              style={{
                color: isToday
                  ? 'var(--accent-primary)'
                  : !isCurrentMonth
                  ? 'var(--text-muted)'
                  : 'var(--text-secondary)',
                fontWeight: isToday ? 700 : 500,
              }}
            >
              {format(day, 'd')}
            </div>
            <div className="space-y-0.5">
              {dayEvents.slice(0, 2).map((event) => (
                <Tooltip key={`${event.type}-${event.id}`} title={event.title} arrow>
                  <div
                    className="text-[10px] px-1 py-0.5 rounded truncate text-white"
                    style={{ backgroundColor: getEventColor(event) }}
                  >
                    {event.title}
                  </div>
                </Tooltip>
              ))}
              {dayEvents.length > 2 && (
                <div
                  className="text-[10px] px-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  +{dayEvents.length - 2} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return <div>{rows}</div>;
  };

  const renderLegend = () => (
    <div
      className="flex flex-wrap gap-4 mt-4 pt-4"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-1.5">
        <Circle sx={{ fontSize: 10, color: '#EF4444' }} />
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Holiday
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Circle sx={{ fontSize: 10, color: '#F59E0B' }} />
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Optional Holiday
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Circle sx={{ fontSize: 10, color: '#10B981' }} />
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Approved Leave
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Circle sx={{ fontSize: 10, color: '#F59E0B' }} />
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Pending Leave
        </span>
      </div>
    </div>
  );

  const renderSelectedDateEvents = () => {
    if (!selectedDate) return null;

    const dayEvents = getEventsForDate(selectedDate);
    if (dayEvents.length === 0) return null;

    return (
      <div
        className="mt-4 pt-4"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <h4
          className="text-sm font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h4>
        <div className="space-y-2">
          {dayEvents.map((event) => (
            <div
              key={`${event.type}-${event.id}`}
              className="flex items-center gap-2 p-2 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getEventColor(event) }}
              />
              <div className="flex-1">
                <p
                  className="text-sm font-medium capitalize"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {event.title}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {event.type === 'holiday'
                    ? event.isOptional
                      ? 'Optional Holiday'
                      : 'Public Holiday'
                    : `Leave - ${event.status}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex justify-center items-center h-[300px]">
          <CircularProgress size={32} sx={{ color: 'var(--accent-primary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6 transition-all duration-200"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderLegend()}
      {renderSelectedDateEvents()}
    </div>
  );
};

export default LeaveCalendar;
