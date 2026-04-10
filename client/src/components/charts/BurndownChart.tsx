import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IBurndownData } from '@/types';

type TChartRow = {
  date: string;
  label: string;
  ideal: number;
  actual: number;
  actualGood: number | null;
  actualBad: number | null;
};

interface BurndownChartProps {
  data: IBurndownData;
}

const formatTick = (label: string): string => label;

const BurndownTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TChartRow }>;
}) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-gray-900">Date: {row.date}</p>
      <p className="text-blue-600">Ideal: {row.ideal} points</p>
      <p className="text-gray-800">Actual: {row.actual} points</p>
    </div>
  );
};

const BurndownChart = ({ data }: BurndownChartProps) => {
  const chartData = useMemo((): TChartRow[] => {
    return data.data.map((row) => {
      const [, m, day] = row.date.split('-').map(Number);
      const label = `${String(m).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
      const behind = row.actual > row.ideal;
      return {
        ...row,
        label,
        actualGood: behind ? null : row.actual,
        actualBad: behind ? row.actual : null,
      };
    });
  }, [data.data]);

  return (
    <div className="w-full" style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} tickFormatter={formatTick} />
          <YAxis tick={{ fontSize: 12 }} label={{ value: 'Points remaining', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<BurndownTooltip />} />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: 16 }}
            formatter={(value: string) => {
              if (value === 'ideal') return 'Ideal';
              if (value === 'actualGood') return 'Actual (on track)';
              if (value === 'actualBad') return 'Actual (behind)';
              return value;
            }}
          />
          <Line
            type="monotone"
            dataKey="ideal"
            name="ideal"
            stroke="#2563eb"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ r: 3 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="actualGood"
            name="actualGood"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="actualBad"
            name="actualBad"
            stroke="#dc2626"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BurndownChart;
