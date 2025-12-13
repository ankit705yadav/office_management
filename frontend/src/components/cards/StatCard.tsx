import React from 'react';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // Percentage change
  chartData?: number[];
  chartColor?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  chartColor = '#f14e1e',
  icon,
  iconBgColor,
}) => {
  const isPositiveTrend = trend !== undefined && trend >= 0;

  return (
    <div
      className="rounded-lg p-4 h-full transition-all duration-200"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header Row: Icon, Title, Trend */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: iconBgColor || 'var(--accent-primary-light)' }}
            >
              {icon}
            </div>
          )}
          <p
            className="text-xs font-medium truncate"
            style={{ color: 'var(--text-secondary)' }}
          >
            {title}
          </p>
        </div>

        {/* Trend Badge */}
        {trend !== undefined && (
          <div
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
            style={{
              backgroundColor: isPositiveTrend
                ? 'var(--accent-success-light)'
                : 'var(--accent-error-light)',
              color: isPositiveTrend
                ? 'var(--accent-success)'
                : 'var(--accent-error)',
            }}
          >
            {isPositiveTrend ? (
              <TrendingUp sx={{ fontSize: 12 }} />
            ) : (
              <TrendingDown sx={{ fontSize: 12 }} />
            )}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      {/* Value Row */}
      <div className="flex items-baseline gap-2">
        <h3
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </h3>
        {subtitle && (
          <span
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
