import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BudgetAllocation } from '@/lib/budgetCalculations';

interface BudgetDonutChartProps {
  allocations: BudgetAllocation;
  currency: string;
  currencySymbol: string;
}

export const BudgetDonutChart: React.FC<BudgetDonutChartProps> = ({
  allocations,
  currency,
  currencySymbol,
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const data = [
    {
      name: 'Needs',
      value: allocations.needs,
      percentage: 50,
      color: '#10b981', // Emerald for needs
      description: 'Housing, Food, Transport',
    },
    {
      name: 'Wants',
      value: allocations.wants,
      percentage: 30,
      color: '#8b5cf6', // Purple for wants
      description: 'Entertainment, Dining',
    },
    {
      name: 'Savings & Debt',
      value: allocations.savings,
      percentage: 20,
      color: '#06b6d4', // Cyan for savings
      description: 'Emergency Fund, Investments',
    },
  ];

  const total = allocations.needs + allocations.wants + allocations.savings;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs font-semibold text-foreground">{data.name}</p>
          <p className="text-sm font-mono font-bold" style={{ color: data.color }}>
            {currencySymbol}{data.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{data.percentage}% of budget</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Donut Chart */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <h3 className="font-heading font-bold text-lg mb-6">Budget Allocation</h3>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={4}
              dataKey="value"
              onMouseEnter={(_, index) => setHoveredSegment(data[index].name)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={hoveredSegment === null || hoveredSegment === entry.name ? 1 : 0.4}
                  style={{ transition: 'opacity 0.3s ease', cursor: 'pointer' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="text-center -mt-24 relative z-10 pointer-events-none">
          <p className="text-sm text-muted-foreground">Total Monthly</p>
          <p className="text-3xl font-mono font-bold text-foreground">
            {currencySymbol}{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        {data.map((segment) => (
          <div
            key={segment.name}
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.2)] transition-all cursor-pointer group"
            onMouseEnter={() => setHoveredSegment(segment.name)}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            {/* Color indicator */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <h4 className="font-semibold text-sm text-foreground">{segment.name}</h4>
              </div>
              <span className="text-xs font-bold text-primary">{segment.percentage}%</span>
            </div>

            {/* Amount */}
            <p className="font-mono font-bold text-lg text-foreground mb-1">
              {currencySymbol}{segment.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>

            {/* Description */}
            <p className="text-xs text-muted-foreground">{segment.description}</p>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  backgroundColor: segment.color,
                  width: '100%',
                  opacity: hoveredSegment === segment.name ? 1 : 0.6,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Budget tips */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-primary mb-2">Budget Guideline</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The 50/30/20 rule helps you allocate your income into three categories. This ensures
          you cover your essential needs, enjoy your wants, and save for your future. You can
          customize these percentages in Budget Settings.
        </p>
      </div>
    </div>
  );
};
