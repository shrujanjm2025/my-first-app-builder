import React from 'react';
import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { BudgetCategory } from '@/lib/budgetCalculations';

interface BudgetCategoryTrackerProps {
  categories: BudgetCategory[];
  currencySymbol: string;
}

export const BudgetCategoryTracker: React.FC<BudgetCategoryTrackerProps> = ({
  categories,
  currencySymbol,
}) => {
  // Group categories by type
  const needsCategories = categories.filter(c => c.type === 'needs');
  const wantsCategories = categories.filter(c => c.type === 'wants');
  const savingsCategories = categories.filter(c => c.type === 'savings');

  const getCategoryColor = (percentageUsed: number): { bg: string; fill: string } => {
    if (percentageUsed >= 100) {
      return { bg: 'bg-destructive/20', fill: 'bg-destructive' };
    } else if (percentageUsed >= 80) {
      return { bg: 'bg-yellow-500/20', fill: 'bg-yellow-500' };
    } else {
      return { bg: 'bg-primary/20', fill: 'bg-primary' };
    }
  };

  const renderCategoryGroup = (groupName: string, items: BudgetCategory[], groupColor: string) => {
    if (items.length === 0) return null;

    return (
      <div key={groupName} className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: groupColor }} />
          {groupName}
        </h4>
        <div className="space-y-3">
          {items.map(category => {
            const colors = getCategoryColor(category.percentageUsed);
            const isOverspent = category.percentageUsed >= 100;

            return (
              <div key={category.name} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-medium text-foreground">{category.name}</span>
                    {isOverspent && (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-semibold text-foreground">
                      {currencySymbol}{category.spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      of {currencySymbol}{category.allocated.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className={`h-2 rounded-full overflow-hidden ${colors.bg} transition-all`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${colors.fill}`}
                    style={{
                      width: `${Math.min(category.percentageUsed, 100)}%`,
                    }}
                  />
                  {/* Overspend indicator */}
                  {isOverspent && (
                    <div
                      className="h-full bg-destructive animate-pulse"
                      style={{
                        width: `${Math.min(category.percentageUsed - 100, 20)}%`,
                      }}
                    />
                  )}
                </div>

                {/* Percentage and status */}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {category.percentageUsed.toFixed(0)}% used
                  </span>
                  {category.remaining > 0 && !isOverspent && (
                    <span className="text-[10px] text-green-600 dark:text-green-500">
                      {currencySymbol}{category.remaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })} remaining
                    </span>
                  )}
                  {isOverspent && (
                    <span className="text-[10px] text-destructive font-semibold">
                      Over by {currencySymbol}{(category.spent - category.allocated).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Needs (Green) */}
      {needsCategories.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          {renderCategoryGroup('Essential Needs (50%)', needsCategories, '#10b981')}
        </div>
      )}

      {/* Wants (Purple) */}
      {wantsCategories.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          {renderCategoryGroup('Wants & Entertainment (30%)', wantsCategories, '#8b5cf6')}
        </div>
      )}

      {/* Savings & Debt (Cyan) */}
      {savingsCategories.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          {renderCategoryGroup('Savings & Debt Repayment (20%)', savingsCategories, '#06b6d4')}
        </div>
      )}

      {/* Empty state */}
      {categories.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground">No spending data available yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Link a bank account to start tracking expenses.</p>
        </div>
      )}
    </div>
  );
};
