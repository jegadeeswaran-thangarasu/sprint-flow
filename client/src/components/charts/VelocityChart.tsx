import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IVelocityData } from '@/types';

interface VelocityChartProps {
  data: IVelocityData;
}

const VelocityTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md space-y-0.5">
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="font-medium">
          {entry.name === 'committed' ? 'Committed' : 'Completed'}: {entry.value} pts
        </p>
      ))}
    </div>
  );
};

const VelocityChart = ({ data }: VelocityChartProps) => {
  const chartData = data.map((row) => ({
    name: row.sprintName.length > 18 ? `${row.sprintName.slice(0, 16)}…` : row.sprintName,
    committed: row.committed,
    completed: row.completed,
  }));

  return (
    <div className="w-full" style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-28}
            textAnchor="end"
            height={56}
          />
          <YAxis tick={{ fontSize: 12 }} label={{ value: 'Story points', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<VelocityTooltip />} cursor={{ fill: 'rgb(249 250 251)' }} />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: 8 }}
            formatter={(value) => (value === 'committed' ? 'Committed' : 'Completed')}
          />
          <Bar dataKey="committed" name="committed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" name="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VelocityChart;
