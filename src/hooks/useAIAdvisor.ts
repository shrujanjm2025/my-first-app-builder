import { useState, useCallback, useRef } from 'react';
import { advisorApi, FinancialContext, AdvisorMessage } from '@/integrations/openai/client';
import { useToast } from '@/hooks/use-toast';

interface UseAIAdvisorProps {
  context: FinancialContext;
}

export const useAIAdvisor = ({ context }: UseAIAdvisorProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const messagesRef = useRef<AdvisorMessage[]>([]);

  // Send a message to the AI Advisor
  const sendMessage = useCallback(
    async (userMessage: string) => {
      try {
        setLoading(true);
        const newMessages: AdvisorMessage[] = [
          ...messagesRef.current,
          { role: 'user', content: userMessage },
        ];
        messagesRef.current = newMessages;
        setMessages([...newMessages]);

        const response = await advisorApi.chatWithAdvisor(newMessages, context);
        const advisorMessage: AdvisorMessage = {
          role: 'assistant',
          content: response.message || 'I encountered an issue processing your request.',
        };

        messagesRef.current = [...newMessages, advisorMessage];
        setMessages([...messagesRef.current]);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to get advisor response');
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [context, toast]
  );

  // Get financial insights
  const getInsights = useCallback(async () => {
    try {
      setLoading(true);
      const response = await advisorApi.getFinancialInsights(context);
      setInsights(response.insights);
      return response.insights;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to get insights');
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [context, toast]);

  // Analyze spending patterns
  const analyzeSpending = useCallback(async () => {
    try {
      setLoading(true);
      const response = await advisorApi.analyzeSpendingPatterns(context.recentTransactions);
      return response.analysis;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to analyze spending');
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [context, toast]);

  // Get nudge when approaching budget limit
  const getNudge = useCallback(
    async (category: string, percentageUsed: number) => {
      try {
        const response = await advisorApi.getNudgeSuggestion(category, percentageUsed, context);
        return response.nudge;
      } catch (error) {
        // Silently fail for nudges
        console.error('Failed to get nudge:', error);
        return null;
      }
    },
    [context]
  );

  // Get debt payoff recommendations
  const getDebtPayoffPlan = useCallback(
    async (loans: any[], monthlyExtra: number) => {
      try {
        setLoading(true);
        const response = await advisorApi.getDebtPayoffPlan(loans, monthlyExtra);
        return response.plan;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to get debt payoff plan');
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Get goal recommendations
  const getGoalRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await advisorApi.getGoalRecommendations(context);
      return response.recommendations;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to get goal recommendations');
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [context, toast]);

  // Clear chat history
  const clearChat = useCallback(() => {
    messagesRef.current = [];
    setMessages([]);
  }, []);

  return {
    messages,
    loading,
    insights,
    sendMessage,
    getInsights,
    analyzeSpending,
    getNudge,
    getDebtPayoffPlan,
    getGoalRecommendations,
    clearChat,
  };
};
