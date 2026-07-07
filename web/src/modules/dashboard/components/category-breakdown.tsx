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
  'bg-primary', // Refined Emerald
  'bg-tertiary', // Off-White/Parchment
  'bg-outline', // Olive grey
  'bg-accent', // Deep Emerald container
  'bg-[#bbeed5]', // Secondary Fixed
  'bg-[#8ec0a9]', // On Secondary Container
  'bg-[#7c7d7b]', // On Primary Container
  'bg-outline-variant', // Deeper olive grey
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
                  <div className="text-muted-foreground font-medium flex items-center gap-2">
                    <span className="data-mono">{formatCurrency(cat.amount)}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted/40 font-semibold text-muted-foreground shrink-0 data-mono">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Progress Bar Container */}
                <div className="w-full bg-muted/30 rounded-[2px] h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-[2px] transition-all duration-500 ${colorClass}`}
                    style={{ width: `${cat.percentage}%` }}
                    role="progressbar"
                    aria-valuenow={cat.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
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
