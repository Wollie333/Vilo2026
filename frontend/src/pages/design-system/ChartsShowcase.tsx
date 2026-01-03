import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card } from '@/components/ui';
import { designTokens } from '@/design-system';
import { PageHeader, ShowcaseGrid } from './components';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Sample data
const barData = [
  { name: 'Jan', revenue: 4000, bookings: 24 },
  { name: 'Feb', revenue: 3000, bookings: 13 },
  { name: 'Mar', revenue: 5000, bookings: 28 },
  { name: 'Apr', revenue: 2780, bookings: 19 },
  { name: 'May', revenue: 1890, bookings: 8 },
  { name: 'Jun', revenue: 2390, bookings: 15 },
];

const lineData = [
  { name: 'Week 1', users: 400, sessions: 2400 },
  { name: 'Week 2', users: 300, sessions: 1398 },
  { name: 'Week 3', users: 520, sessions: 3800 },
  { name: 'Week 4', users: 278, sessions: 3908 },
  { name: 'Week 5', users: 189, sessions: 4800 },
  { name: 'Week 6', users: 239, sessions: 3800 },
  { name: 'Week 7', users: 349, sessions: 4300 },
];

const pieData = [
  { name: 'Apartments', value: 400 },
  { name: 'Houses', value: 300 },
  { name: 'Villas', value: 200 },
  { name: 'Studios', value: 100 },
];

const areaData = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 5000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 1890 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
];

// Chart colors using brand colors
const CHART_COLORS = [
  designTokens.colors.primary.DEFAULT,
  designTokens.colors.info.DEFAULT,
  designTokens.colors.warning.DEFAULT,
  designTokens.colors.success.DEFAULT,
  designTokens.colors.error.DEFAULT,
];

export function ChartsShowcase() {
  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <PageHeader
          title="Charts"
          description="Data visualization components built with Recharts, styled with brand colors."
        />

      <ShowcaseGrid cols={2}>
        {/* Bar Chart */}
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Bar Chart
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Compare values across categories
            </p>
          </Card.Header>
          <Card.Body>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar
                    dataKey="revenue"
                    name="Revenue ($)"
                    fill={designTokens.colors.primary.DEFAULT}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="bookings"
                    name="Bookings"
                    fill={designTokens.colors.info.DEFAULT}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        {/* Line Chart */}
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Line Chart
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Track trends over time
            </p>
          </Card.Header>
          <Card.Body>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line
                    type="monotone"
                    dataKey="users"
                    name="Users"
                    stroke={designTokens.colors.primary.DEFAULT}
                    strokeWidth={2}
                    dot={{ fill: designTokens.colors.primary.DEFAULT, strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    name="Sessions"
                    stroke={designTokens.colors.info.DEFAULT}
                    strokeWidth={2}
                    dot={{ fill: designTokens.colors.info.DEFAULT, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        {/* Pie Chart */}
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Pie Chart
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Show proportions of a whole
            </p>
          </Card.Header>
          <Card.Body>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        {/* Area Chart */}
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Area Chart
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Show volume and trends with filled areas
            </p>
          </Card.Header>
          <Card.Body>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={designTokens.colors.primary.DEFAULT}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={designTokens.colors.primary.DEFAULT}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Revenue"
                    stroke={designTokens.colors.primary.DEFAULT}
                    strokeWidth={2}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>
      </ShowcaseGrid>

      {/* Stacked Bar Chart */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Stacked Bar Chart
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Compare multiple data series stacked
          </p>
        </Card.Header>
        <Card.Body>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  dataKey="revenue"
                  name="Revenue ($)"
                  stackId="a"
                  fill={designTokens.colors.primary.DEFAULT}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="bookings"
                  name="Bookings (x100)"
                  stackId="a"
                  fill={designTokens.colors.primary[300]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card.Body>
      </Card>

      {/* Usage Note */}
      <Card variant="bordered" padding="md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-info/10 text-info">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
              Using Charts
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Charts are built with Recharts. Import components from{' '}
              <code className="bg-gray-100 dark:bg-dark-card px-1 py-0.5 rounded">recharts</code>{' '}
              and use design tokens from{' '}
              <code className="bg-gray-100 dark:bg-dark-card px-1 py-0.5 rounded">@/design-system</code>{' '}
              for consistent colors.
            </p>
          </div>
        </div>
      </Card>
      </div>
    </AuthenticatedLayout>
  );
}
