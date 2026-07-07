import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cuan/ui';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type CategoryItem = {
  id: number | null;
  label: string;
  amount: number;
  percentage: number;
};

type Props = {
  categories: CategoryItem[];
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val);
};

const CHART_COLORS = [
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#64748b', // slate-500
];

export function CategoryBreakdown({ categories }: Props) {
  const sortedCategories = [...categories].sort((a, b) => Number(b.amount) - Number(a.amount));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border/10 p-3 rounded-lg shadow-xl text-sm min-w-[150px]">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.fill || CHART_COLORS[0] }}
            />
            <span className="font-semibold text-foreground">{data.label}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-mono font-medium text-foreground">
              {formatCurrency(data.amount)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4 mt-1">
            <span className="text-muted-foreground">Share:</span>
            <span className="font-mono font-medium text-foreground">
              {data.percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col h-full min-h-[380px]">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Category Breakdown</CardTitle>
        <CardDescription>Expenses by category in the selected period</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0 pb-4">
        {sortedCategories.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-8 text-sm">
            No expenses in this period
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sortedCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="label"
                    animationDuration={1000}
                    animationBegin={200}
                  >
                    {sortedCategories.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="var(--background)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Independent Custom Legend */}
            <ul className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-2 w-full mt-2">
              {sortedCategories.map((entry, index) => (
                <li key={`item-${index}`} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="truncate text-foreground">{entry.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                    <span className="font-mono text-xs">{formatCurrency(entry.amount)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 font-semibold data-mono min-w-[40px] text-right">
                      {entry.percentage.toFixed(1)}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
