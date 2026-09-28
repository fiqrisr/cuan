import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cuan/ui';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from 'recharts';

type CategoryTooltipProps = Partial<TooltipContentProps<number, string>>;

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
  '#3d8f73',
  '#5da88e',
  '#7ec0a9',
  '#9fd1ba',
  '#b8c9c1',
  '#8e928f',
  '#6b7d74',
  '#4a5a52',
];

export function CategoryBreakdown({ categories }: Props) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => Number(b.amount) - Number(a.amount)),
    [categories],
  );

  const totalExpenses = useMemo(
    () => sortedCategories.reduce((sum, c) => sum + Number(c.amount), 0),
    [sortedCategories],
  );

  const activeItem = activeIndex !== null ? sortedCategories[activeIndex] : null;

  const CustomTooltip = ({ active, payload }: CategoryTooltipProps) => {
    if (active && payload?.length) {
      const data = payload[0].payload as CategoryItem;
      const index = sortedCategories.findIndex(c => c.label === data.label);
      const color = CHART_COLORS[(index >= 0 ? index : 0) % CHART_COLORS.length];

      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-md text-sm min-w-[170px] z-50">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-border/30">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="font-semibold text-foreground truncate text-xs">{data.label}</span>
          </div>
          <div className="flex justify-between items-center gap-4 text-xs">
            <span className="text-muted-foreground">{t('common.amount')}:</span>
            <span className="font-mono font-medium text-foreground">
              {formatCurrency(data.amount)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4 mt-1.5 text-xs">
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
    <Card className="flex flex-col h-full min-h-[420px]">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {t('dashboard.categoryBreakdown')}
        </CardTitle>
        <CardDescription>{t('transactions.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0 pb-4">
        {sortedCategories.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-10 gap-2">
            <div className="p-3 rounded-full bg-muted/30">
              <span className="block h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-foreground">{t('common.noResults')}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-3">
            <div className="relative h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sortedCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={84}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="label"
                    animationDuration={600}
                    animationBegin={100}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={(_, index) => setActiveIndex(prev => (prev === index ? null : index))}
                  >
                    {sortedCategories.map((entry, index) => {
                      const isSelected = activeIndex === index;
                      const isAnySelected = activeIndex !== null;
                      const opacity = isAnySelected ? (isSelected ? 1 : 0.4) : 1;
                      const stroke = isSelected ? 'var(--foreground)' : 'var(--background)';

                      return (
                        <Cell
                          key={`cell-${entry.label || index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          opacity={opacity}
                          stroke={stroke}
                          strokeWidth={isSelected ? 3 : 2}
                          className="transition-all duration-200 cursor-pointer"
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Donut Center Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate max-w-[110px]">
                  {activeItem ? activeItem.label : t('dashboard.totalExpenses')}
                </span>
                <span className="font-mono text-sm font-semibold text-foreground mt-0.5">
                  {formatCurrency(activeItem ? activeItem.amount : totalExpenses)}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {activeItem
                    ? `${activeItem.percentage.toFixed(1)}%`
                    : `${sortedCategories.length} ${t('common.category').toLowerCase()}`}
                </span>
              </div>
            </div>

            {/* Independent Custom Interactive Legend */}
            <ul className="flex flex-col gap-1.5 max-h-[170px] overflow-y-auto pr-1 w-full mt-1">
              {sortedCategories.map((entry, index) => {
                const isSelected = activeIndex === index;
                const isAnySelected = activeIndex !== null;

                return (
                  <li key={`item-${entry.label || index}`}>
                    <button
                      type="button"
                      onClick={() => setActiveIndex(prev => (prev === index ? null : index))}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      className={`w-full flex items-center justify-between text-sm py-1.5 px-2 rounded-md transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-muted/80 ring-1 ring-border shadow-xs'
                          : isAnySelected
                            ? 'opacity-50 hover:opacity-100 hover:bg-muted/40'
                            : 'hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden mr-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="truncate text-foreground text-xs font-medium">
                          {entry.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                        <span className="font-mono text-xs">{formatCurrency(entry.amount)}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 font-semibold data-mono min-w-[38px] text-right">
                          {entry.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
