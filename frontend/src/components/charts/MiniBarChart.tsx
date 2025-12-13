import React from 'react';

interface MiniBarChartProps {
  data: number[];
  color?: string;
  height?: number;
}

const MiniBarChart: React.FC<MiniBarChartProps> = ({
  data,
  color = '#5B4DFF',
  height = 60,
}) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const barWidth = 100 / data.length;

  return (
    <div className="flex items-end gap-1 h-full">
      {data.map((value, index) => {
        const barHeight = max > 0 ? (value / max) * height : 0;
        const isLast = index === data.length - 1;

        return (
          <div
            key={index}
            className="flex-1 rounded-t-lg transition-all duration-300 hover:opacity-80"
            style={{
              height: `${barHeight}px`,
              backgroundColor: isLast ? color : `${color}80`,
              minHeight: '4px',
            }}
          />
        );
      })}
    </div>
  );
};

export default MiniBarChart;
