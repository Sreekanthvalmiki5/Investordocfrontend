import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { FinancialMetrics } from '@/types';

const axisProps = {
  stroke: 'hsl(215 20% 65%)',
  fontSize: 10,
  tickLine: false,
  axisLine: false,
};

const chartTooltipStyle = {
  backgroundColor: 'hsl(222 47% 11%)',
  border: '1px solid hsl(217 33% 20%)',
  borderRadius: '8px',
  fontSize: '12px',
};

export function FinancialCharts({ metrics }: { metrics: FinancialMetrics }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <ChartCard title="Revenue (Rs Cr)">
        <AreaChart data={metrics.revenue} margin={{ top: 10, right: 6, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" vertical={false} />
          <XAxis dataKey="period" {...axisProps} />
          <YAxis {...axisProps} width={42} />
          <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'hsl(210 40% 98%)' }} />
          <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} fill="url(#revFill)" />
        </AreaChart>
      </ChartCard>

      <ChartCard title="Net Profit (Rs Cr)">
        <BarChart data={metrics.profit} margin={{ top: 10, right: 6, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" vertical={false} />
          <XAxis dataKey="period" {...axisProps} />
          <YAxis {...axisProps} width={42} />
          <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'hsl(210 40% 98%)' }} />
          <Bar dataKey="value" fill="#10B981" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="EPS (Rs)">
        <LineChart data={metrics.eps} margin={{ top: 10, right: 6, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" vertical={false} />
          <XAxis dataKey="period" {...axisProps} />
          <YAxis {...axisProps} width={42} />
          <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'hsl(210 40% 98%)' }} />
          <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 3 }} />
        </LineChart>
      </ChartCard>

      <ChartCard title="YoY Growth (%)">
        <BarChart data={metrics.growth} margin={{ top: 10, right: 6, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" vertical={false} />
          <XAxis dataKey="period" {...axisProps} />
          <YAxis {...axisProps} width={42} />
          <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'hsl(210 40% 98%)' }} />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {metrics.growth.map((g, i) => (
              <Cell key={i} fill={g.value >= 0 ? '#2563EB' : '#EF4444'} />
            ))}
          </Bar>
        </BarChart>
      </ChartCard>
    </div>
  );
}

import { Cell } from 'recharts';

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-3.5 rounded-xl bg-card border border-border">
      <p className="text-xs font-medium text-foreground mb-2">{title}</p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
