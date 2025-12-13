import { Op } from 'sequelize';
import {
  differenceInMinutes,
  format,
  startOfDay,
  endOfDay,
  parse,
  addMinutes,
  isSameDay,
  isWeekend,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns';
import Attendance from '../models/Attendance';
import AttendanceSetting from '../models/AttendanceSetting';
import Holiday from '../models/Holiday';
import LeaveRequest from '../models/LeaveRequest';
import User from '../models/User';
import { AttendanceStatus, RequestStatus } from '../types/enums';
import logger from '../utils/logger';

/**
 * Calculate work hours between check-in and check-out times
 */
export const calculateWorkHours = (
  checkIn: Date,
  checkOut: Date
): number => {
  const totalMinutes = differenceInMinutes(checkOut, checkIn);
  const hours = totalMinutes / 60;
  // Round to 2 decimal places
  return Math.round(hours * 100) / 100;
};

/**
 * Check if check-in time is late based on settings
 */
export const isLateArrival = async (
  checkInTime: Date,
  departmentId?: number
): Promise<boolean> => {
  try {
    // Try to get department-specific settings first
    let settings = departmentId
      ? await AttendanceSetting.findOne({ where: { departmentId } })
      : null;

    // Fall back to company-wide settings if no department-specific settings
    if (!settings) {
      settings = await AttendanceSetting.findOne({ where: { departmentId: { [Op.is]: null } as any } });
    }

    if (!settings) {
      logger.warn('No attendance settings found, using default');
      return false;
    }

    const checkInDate = format(checkInTime, 'yyyy-MM-dd');
    const workStartDateTime = parse(
      `${checkInDate} ${settings.workStartTime}`,
      'yyyy-MM-dd HH:mm:ss',
      new Date()
    );

    const graceTimeDateTime = addMinutes(
      workStartDateTime,
      settings.gracePeriodMinutes
    );

    return checkInTime > graceTimeDateTime;
  } catch (error) {
    logger.error('Error checking late arrival:', error);
    return false;
  }
};

/**
 * Check if check-out time is early based on settings
 */
export const isEarlyDeparture = async (
  checkOutTime: Date,
  departmentId?: number
): Promise<boolean> => {
  try {
    // Try to get department-specific settings first
    let settings = departmentId
      ? await AttendanceSetting.findOne({ where: { departmentId } })
      : null;

    // Fall back to company-wide settings
    if (!settings) {
      settings = await AttendanceSetting.findOne({ where: { departmentId: { [Op.is]: null } as any } });
    }

    if (!settings) {
      logger.warn('No attendance settings found, using default');
      return false;
    }

    const checkOutDate = format(checkOutTime, 'yyyy-MM-dd');
    const workEndDateTime = parse(
      `${checkOutDate} ${settings.workEndTime}`,
      'yyyy-MM-dd HH:mm:ss',
      new Date()
    );

    return checkOutTime < workEndDateTime;
  } catch (error) {
    logger.error('Error checking early departure:', error);
    return false;
  }
};

/**
 * Get attendance status for a specific date
 * Considers weekends, holidays, and leaves
 */
export const getAttendanceStatusForDate = async (
  userId: number,
  date: Date
): Promise<AttendanceStatus> => {
  try {
    // Check if it's a weekend
    if (isWeekend(date)) {
      return AttendanceStatus.WEEKEND;
    }

    // Check if it's a holiday
    const dateStr = format(date, 'yyyy-MM-dd');
    const holiday = await Holiday.findOne({
      where: {
        date: dateStr,
      },
    });

    if (holiday) {
      return AttendanceStatus.HOLIDAY;
    }

    // Check if user is on leave
    const leave = await LeaveRequest.findOne({
      where: {
        userId,
        startDate: {
          [Op.lte]: date,
        },
        endDate: {
          [Op.gte]: date,
        },
        status: RequestStatus.APPROVED,
      },
    });

    if (leave) {
      return AttendanceStatus.ON_LEAVE;
    }

    // Check existing attendance record
    const attendance = await Attendance.findOne({
      where: {
        userId,
        date: dateStr,
      },
    });

    return attendance?.status || AttendanceStatus.ABSENT;
  } catch (error) {
    logger.error('Error getting attendance status for date:', error);
    return AttendanceStatus.ABSENT;
  }
};

/**
 * Automatically mark attendance for users on approved leave
 * Should be run daily via cron job
 */
export const autoMarkLeaveAsAttendance = async (): Promise<void> => {
  try {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // Find all approved leaves for today
    const leaves = await LeaveRequest.findAll({
      where: {
        startDate: {
          [Op.lte]: today,
        },
        endDate: {
          [Op.gte]: today,
        },
        status: RequestStatus.APPROVED,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    logger.info(`Found ${leaves.length} approved leaves for ${todayStr}`);

    for (const leave of leaves) {
      // Check if attendance record already exists
      const existingAttendance = await Attendance.findOne({
        where: {
          userId: leave.userId,
          date: todayStr,
        },
      });

      if (!existingAttendance) {
        // Create attendance record with status 'on_leave'
        await Attendance.create({
          userId: leave.userId,
          date: today,
          status: AttendanceStatus.ON_LEAVE,
          workHours: 0,
          isLate: false,
          isEarlyDeparture: false,
          notes: `On leave: ${leave.leaveType}`,
        });

        logger.info(
          `Auto-marked attendance as ON_LEAVE for user ${leave.userId} on ${todayStr}`
        );
      }
    }
  } catch (error) {
    logger.error('Error auto-marking leave attendance:', error);
  }
};

/**
 * Automatically mark absent for users who didn't check in
 * Should be run at end of day via cron job
 */
export const autoMarkAbsent = async (): Promise<void> => {
  try {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // Skip weekends
    if (isWeekend(today)) {
      logger.info('Today is weekend, skipping auto-mark absent');
      return;
    }

    // Check if today is a holiday
    const holiday = await Holiday.findOne({
      where: {
        date: todayStr,
      },
    });

    if (holiday) {
      logger.info('Today is a holiday, skipping auto-mark absent');
      return;
    }

    // Get all active users
    const users = await User.findAll({
      where: {
        status: 'active',
      },
      attributes: ['id', 'firstName', 'lastName', 'email'],
    });

    logger.info(`Checking attendance for ${users.length} active users`);

    for (const user of users) {
      // Check if attendance record exists
      const attendance = await Attendance.findOne({
        where: {
          userId: user.id,
          date: todayStr,
        },
      });

      // If no attendance record, check if user is on leave
      if (!attendance) {
        const isOnLeave = await LeaveRequest.findOne({
          where: {
            userId: user.id,
            startDate: {
              [Op.lte]: today,
            },
            endDate: {
              [Op.gte]: today,
            },
            status: RequestStatus.APPROVED,
          },
        });

        if (isOnLeave) {
          // Create on-leave attendance record
          await Attendance.create({
            userId: user.id,
            date: today,
            status: AttendanceStatus.ON_LEAVE,
            workHours: 0,
            isLate: false,
            isEarlyDeparture: false,
            notes: `On leave: ${isOnLeave.leaveType}`,
          });

          logger.info(`Marked user ${user.id} as ON_LEAVE for ${todayStr}`);
        } else {
          // Mark as absent
          await Attendance.create({
            userId: user.id,
            date: today,
            status: AttendanceStatus.ABSENT,
            workHours: 0,
            isLate: false,
            isEarlyDeparture: false,
          });

          logger.info(`Marked user ${user.id} as ABSENT for ${todayStr}`);
        }
      } else if (!attendance.checkOutTime && attendance.checkInTime) {
        // User checked in but didn't check out - auto checkout if enabled
        const userWithDept = await User.findByPk(user.id);

        // Try department-specific settings first
        let settings = userWithDept?.departmentId
          ? await AttendanceSetting.findOne({ where: { departmentId: userWithDept.departmentId } })
          : null;

        // Fall back to company-wide settings
        if (!settings) {
          settings = await AttendanceSetting.findOne({ where: { departmentId: { [Op.is]: null } as any } });
        }

        if (settings?.autoCheckoutEnabled) {
          const autoCheckoutTime = parse(
            `${todayStr} ${settings.autoCheckoutTime}`,
            'yyyy-MM-dd HH:mm:ss',
            new Date()
          );

          const workHours = calculateWorkHours(
            attendance.checkInTime,
            autoCheckoutTime
          );

          await attendance.update({
            checkOutTime: autoCheckoutTime,
            workHours,
            notes: attendance.notes
              ? `${attendance.notes} | Auto-checkout at ${format(
                  autoCheckoutTime,
                  'HH:mm'
                )}`
              : `Auto-checkout at ${format(autoCheckoutTime, 'HH:mm')}`,
          });

          logger.info(
            `Auto checked out user ${user.id} at ${format(
              autoCheckoutTime,
              'HH:mm'
            )}`
          );
        }
      }
    }

    logger.info('Completed auto-marking absent users');
  } catch (error) {
    logger.error('Error auto-marking absent:', error);
  }
};

/**
 * Generate monthly attendance report for a user
 */
export const generateMonthlyReport = async (
  userId: number,
  month: number,
  year: number
): Promise<any> => {
  try {
    const startDate = startOfMonth(new Date(year, month - 1, 1));
    const endDate = endOfMonth(startDate);

    const attendance = await Attendance.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['date', 'ASC']],
    });

    // Calculate statistics
    const totalDays = eachDayOfInterval({ start: startDate, end: endDate });
    const workingDays = totalDays.filter(
      (day) => !isWeekend(day)
    ).length;

    const presentDays = attendance.filter(
      (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE
    ).length;

    const absentDays = attendance.filter(
      (a) => a.status === AttendanceStatus.ABSENT
    ).length;

    const lateDays = attendance.filter(
      (a) => a.isLate
    ).length;

    const halfDays = attendance.filter(
      (a) => a.status === AttendanceStatus.HALF_DAY
    ).length;

    const leaveDays = attendance.filter(
      (a) => a.status === AttendanceStatus.ON_LEAVE
    ).length;

    const totalWorkHours = attendance.reduce(
      (sum, a) => sum + parseFloat(a.workHours.toString()),
      0
    );

    const attendancePercentage =
      workingDays > 0
        ? ((presentDays + halfDays * 0.5) / workingDays) * 100
        : 0;

    return {
      userId,
      month,
      year,
      summary: {
        totalDays: totalDays.length,
        workingDays,
        presentDays,
        absentDays,
        lateDays,
        halfDays,
        leaveDays,
        totalWorkHours: Math.round(totalWorkHours * 100) / 100,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
      },
      attendance,
    };
  } catch (error) {
    logger.error('Error generating monthly report:', error);
    throw error;
  }
};

/**
 * Get attendance settings for a user's department
 */
export const getAttendanceSettings = async (
  departmentId?: number
): Promise<AttendanceSetting | null> => {
  try {
    // Try department-specific settings first
    let settings = departmentId
      ? await AttendanceSetting.findOne({ where: { departmentId } })
      : null;

    // Fall back to company-wide settings
    if (!settings) {
      settings = await AttendanceSetting.findOne({ where: { departmentId: { [Op.is]: null } as any } });
    }

    return settings;
  } catch (error) {
    logger.error('Error getting attendance settings:', error);
    return null;
  }
};
