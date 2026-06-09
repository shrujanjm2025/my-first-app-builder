import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  calculateBudgetSummary,
  calculateEmergencyFundTarget,
  getOverspendingRecommendations,
  calculateSpendingTrend,
  BudgetSummary,
  BudgetAllocation,
} from '@/lib/budgetCalculations';
import { useToast } from '@/hooks/use-toast';

interface UseBudgetEngineProps {
  userId: string;
  monthlyIncome: number;
}

export const useBudgetEngine = ({ userId, monthlyIncome }: UseBudgetEngineProps) => {
  const { toast } = useToast();
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [emergencyFundTarget, setEmergencyFundTarget] = useState(0);
  const [customAllocation, setCustomAllocation] = useState<Partial<BudgetAllocation> | undefined>();

  // Fetch monthly spending data
  const fetchMonthlySpending = useCallback(async (year: number, month: number) => {
    try {
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Group spending by category
      const spending: Record<string, number> = {};
      transactions?.forEach(tx => {
        const category = tx.category || 'Uncategorized';
        spending[category] = (spending[category] || 0) + Math.abs(tx.amount);
      });

      return spending;
    } catch (error) {
      console.error('Failed to fetch monthly spending:', error);
      return {};
    }
  }, [userId]);

  // Fetch budget allocations from database
  const fetchBudgetAllocations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Convert budget records to allocation format
      const allocation: Partial<BudgetAllocation> = {};
      data?.forEach(budget => {
        if (budget.category === 'Needs') allocation.needs = budget.allocated_amount;
        if (budget.category === 'Wants') allocation.wants = budget.allocated_amount;
        if (budget.category === 'Savings') allocation.savings = budget.allocated_amount;
      });

      return Object.keys(allocation).length > 0 ? allocation : undefined;
    } catch (error) {
      console.error('Failed to fetch budget allocations:', error);
      return undefined;
    }
  }, [userId]);

  // Load budget data on mount and when month changes
  useEffect(() => {
    const loadBudgetData = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const spending = await fetchMonthlySpending(now.getFullYear(), now.getMonth());
        const allocations = await fetchBudgetAllocations();
        
        setCustomAllocation(allocations);
        const summary = calculateBudgetSummary(monthlyIncome, spending, allocations);
        setBudgetSummary(summary);
        
        // Calculate emergency fund target (default 6 months)
        const { data: profile } = await supabase
          .from('users_financial_profile')
          .select('dependents')
          .eq('id', userId)
          .single();
        
        const target = calculateEmergencyFundTarget(
          summary.allocations.needs,
          profile?.dependents || 0
        );
        setEmergencyFundTarget(target);
      } catch (error) {
        console.error('Failed to load budget data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load budget information',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (monthlyIncome > 0) {
      loadBudgetData();
    }
  }, [monthlyIncome, userId, fetchMonthlySpending, fetchBudgetAllocations, toast]);

  // Update budget allocation
  const updateBudgetAllocation = useCallback(
    async (allocation: Partial<BudgetAllocation>) => {
      try {
        // Save to database
        const categories = [
          { category: 'Needs', amount: allocation.needs },
          { category: 'Wants', amount: allocation.wants },
          { category: 'Savings', amount: allocation.savings },
        ];

        for (const cat of categories) {
          if (cat.amount) {
            await supabase
              .from('budgets')
              .upsert(
                {
                  user_id: userId,
                  category: cat.category,
                  allocated_amount: cat.amount,
                  month: new Date().toISOString().split('T')[0].slice(0, 7),
                },
                {
                  onConflict: 'user_id,category,month',
                }
              );
          }
        }

        setCustomAllocation(allocation);
        if (budgetSummary) {
          const updated = calculateBudgetSummary(monthlyIncome, budgetSummary.categories.reduce((acc, cat) => {
            acc[cat.name] = cat.spent;
            return acc;
          }, {} as Record<string, number>), allocation);
          setBudgetSummary(updated);
        }

        toast({
          title: 'Success',
          description: 'Budget allocation updated',
        });
      } catch (error) {
        console.error('Failed to update budget allocation:', error);
        toast({
          title: 'Error',
          description: 'Failed to update budget allocation',
          variant: 'destructive',
        });
      }
    },
    [userId, budgetSummary, monthlyIncome, toast]
  );

  // Get overspending recommendations
  const getRecommendations = useCallback(() => {
    if (!budgetSummary) return [];
    return getOverspendingRecommendations(budgetSummary.categories);
  }, [budgetSummary]);

  // Get spending trend
  const getSpendingTrendForMonth = useCallback(
    async (year: number, month: number) => {
      try {
        const currentSpending = await fetchMonthlySpending(year, month);
        const currentTotal = Object.values(currentSpending).reduce((a, b) => a + b, 0);

        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const previousSpending = await fetchMonthlySpending(prevYear, prevMonth);
        const previousTotal = Object.values(previousSpending).reduce((a, b) => a + b, 0);

        return calculateSpendingTrend(currentTotal, previousTotal);
      } catch (error) {
        console.error('Failed to calculate spending trend:', error);
        return { trend: 'stable' as const, percentageChange: 0 };
      }
    },
    [fetchMonthlySpending]
  );

  return {
    budgetSummary,
    loading,
    emergencyFundTarget,
    customAllocation,
    updateBudgetAllocation,
    getRecommendations,
    getSpendingTrendForMonth,
  };
};
