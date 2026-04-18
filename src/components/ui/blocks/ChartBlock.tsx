import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

export type ChartData = {
  title: string;
  description?: string;
  type: 'BAR' | 'LINE' | 'PIE';
  data: Record<string, string | number>[];
  xAxisKey?: string;
  yAxisKey?: string;
};

interface ChartBlockProps {
  chart: ChartData;
}

const COLORS = ['var(--accent)', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

export default function ChartBlock({ chart }: ChartBlockProps) {

  const renderChart = () => {
    switch (chart.type) {
      case 'BAR':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart.data} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey={chart.xAxisKey || 'name'} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <RechartsTooltip
                cursor={{ fill: 'var(--surface-2)', opacity: 0.4 }}
                contentStyle={{ backgroundColor: 'var(--surface-0)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar dataKey={chart.yAxisKey || 'value'} fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'LINE':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chart.data} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey={chart.xAxisKey || 'name'} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: 'var(--surface-0)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
              />
              <Line type="monotone" dataKey={chart.yAxisKey || 'value'} stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--surface-0)' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'PIE':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey={chart.yAxisKey || 'value'}
                nameKey={chart.xAxisKey || 'name'}
                stroke="var(--surface-0)"
                strokeWidth={2}
              >
                {chart.data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{ backgroundColor: 'var(--surface-0)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div className="p-4 text-[color:var(--text-muted)] text-center">Unsupported chart type.</div>;
    }
  };

  return (
    <div className="my-8 overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] shadow-sm">
      <div className="p-5 border-b border-[color:var(--border)] bg-[color:var(--surface-1)]">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[color:var(--text-primary)]">{chart.title}</h3>
        {chart.description && <p className="text-sm mt-1 text-[color:var(--text-muted)]">{chart.description}</p>}
      </div>
      <div className="p-2 sm:p-5">
        {renderChart()}
      </div>
    </div>
  );
}
