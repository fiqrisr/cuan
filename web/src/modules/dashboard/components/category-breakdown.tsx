import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cuan/ui';

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

const COLORS = [
  'bg-primary',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-indigo-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-purple-500',
];

export function CategoryBreakdown({ categories }: Props) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Category Breakdown</CardTitle>
        <CardDescription>Expenses by category in the selected period</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[350px] pr-2">
        {categories.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-8 text-sm">
            No expenses in this period
          </div>
        ) : (
          categories.map((cat, idx) => {
            const colorClass = COLORS[idx % COLORS.length];
            return (
              <div key={cat.id ?? cat.label} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-sm">
                  <div className="font-medium flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${colorClass} shrink-0`} />
                    <span className="truncate max-w-[150px]">{cat.label}</span>
                  </div>
                  <div className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <span>{formatCurrency(cat.amount)}</span>
                    <span className="text-xs px-1 py-0.5 rounded bg-muted font-normal text-muted-foreground shrink-0">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Progress Bar Container */}
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
