import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cuan/ui';

type DailyItem = {
  date: string;
  income: number;
  expense: number;
};

type Props = {
  daily: DailyItem[];
};

const formatCompact = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(val);
};

const formatDateLabel = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
};

export function SpendingTrend({ daily }: Props) {
  // SVG Dimensions
  const svgWidth = 600;
  const svgHeight = 240;
  const padding = { top: 15, right: 15, bottom: 30, left: 55 };

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Calculate max value for Y-axis scaling
  const maxVal = Math.max(
    ...daily.map(d => Math.max(d.income, d.expense)),
    10000, // default minimum to avoid division by zero or tiny charts
  );

  // Y-axis gridlines
  const yLinesCount = 4;
  const yGridLines = Array.from({ length: yLinesCount }).map((_, idx) => {
    const val = (maxVal / (yLinesCount - 1)) * idx;
    const y = chartHeight + padding.top - (val / maxVal) * chartHeight;
    return { val, y };
  });

  // X-axis calculations
  const barWidth = daily.length > 0 ? (chartWidth / daily.length) * 0.35 : 0;
  const gap = daily.length > 0 ? (chartWidth / daily.length) * 0.15 : 0;

  // Decimate X-axis labels to avoid overlap
  // target ~6 labels
  const labelInterval = Math.max(1, Math.ceil(daily.length / 6));

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Spending Trend</CardTitle>
        <CardDescription>Daily comparison of income vs expenses</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center min-h-[250px] p-4 pt-0">
        {daily.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-8 text-sm">
            No data available
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[500px]">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto select-none overflow-visible"
              >
                <title>Spending Trend Chart</title>
                {/* Y-Axis Gridlines & Labels */}
                {yGridLines.map(line => (
                  <g key={line.val}>
                    <line
                      x1={padding.left}
                      y1={line.y}
                      x2={svgWidth - padding.right}
                      y2={line.y}
                      stroke="currentColor"
                      className="text-border/30"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 8}
                      y={line.y + 4}
                      textAnchor="end"
                      className="fill-muted-foreground text-[10px] data-mono"
                    >
                      {formatCompact(line.val)}
                    </text>
                  </g>
                ))}

                {/* Bars & X-Axis labels */}
                {daily.map((day, idx) => {
                  const stepWidth = chartWidth / daily.length;
                  const groupX = padding.left + idx * stepWidth + stepWidth / 2;

                  // Coordinate calculation
                  const incomeHeight = (day.income / maxVal) * chartHeight;
                  const expenseHeight = (day.expense / maxVal) * chartHeight;

                  const incomeY = chartHeight + padding.top - incomeHeight;
                  const expenseY = chartHeight + padding.top - expenseHeight;

                  const incomeX = groupX - barWidth - gap / 2;
                  const expenseX = groupX + gap / 2;

                  const isLabelVisible = idx % labelInterval === 0 || idx === daily.length - 1;

                  return (
                    <g key={day.date}>
                      {/* Income Bar (Green) */}
                      {day.income > 0 && (
                        <rect
                          x={incomeX}
                          y={incomeY}
                          width={barWidth}
                          height={incomeHeight}
                          className="fill-success/90 hover:fill-success transition-colors"
                          rx={Math.min(2, barWidth / 2)}
                        >
                          <title>{`Income: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(day.income)}`}</title>
                        </rect>
                      )}

                      {/* Expense Bar (Red) */}
                      {day.expense > 0 && (
                        <rect
                          x={expenseX}
                          y={expenseY}
                          width={barWidth}
                          height={expenseHeight}
                          className="fill-destructive/90 hover:fill-destructive transition-colors"
                          rx={Math.min(2, barWidth / 2)}
                        >
                          <title>{`Expense: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(day.expense)}`}</title>
                        </rect>
                      )}

                      {/* X-axis label */}
                      {isLabelVisible && (
                        <g>
                          <line
                            x1={groupX}
                            y1={chartHeight + padding.top}
                            x2={groupX}
                            y2={chartHeight + padding.top + 4}
                            stroke="currentColor"
                            className="text-border"
                          />
                          <text
                            x={groupX}
                            y={chartHeight + padding.top + 16}
                            textAnchor="middle"
                            className="fill-muted-foreground text-[9px] data-mono"
                          >
                            {formatDateLabel(day.date)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* X-Axis base line */}
                <line
                  x1={padding.left}
                  y1={chartHeight + padding.top}
                  x2={svgWidth - padding.right}
                  y2={chartHeight + padding.top}
                  stroke="currentColor"
                  className="text-border"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Legend */}
        {daily.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded bg-success/90" />
              <span className="text-muted-foreground">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded bg-destructive/90" />
              <span className="text-muted-foreground">Expense</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
