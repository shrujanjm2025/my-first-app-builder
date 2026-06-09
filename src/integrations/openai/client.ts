// OpenAI Integration for Fiscal AI Advisor
// Note: API calls should be made through a backend for security

export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY') {
  console.warn('OpenAI API Key not configured. Please set VITE_OPENAI_API_KEY in your environment variables.');
}

export interface FinancialContext {
  monthlyIncome: number;
  totalExpenses: number;
  budgetAllocations: {
    needs: number;
    wants: number;
    savings: number;
  };
  recentTransactions: Array<{
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
  creditScore?: number;
  loans?: Array<{
    name: string;
    balance: number;
    interestRate: number;
  }>;
  goals?: Array<{
    name: string;
    target: number;
    progress: number;
  }>;
}

export interface AdvisorMessage {
  role: 'user' | 'assistant';
  content: string;
}

// API calls for the Fiscal AI Advisor (backend endpoints)
export const advisorApi = {
  // Get AI-powered financial insights
  async getFinancialInsights(context: FinancialContext) {
    const response = await fetch('/api/openai/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    });
    if (!response.ok) throw new Error('Failed to get financial insights');
    return response.json();
  },

  // Chat with the AI Advisor
  async chatWithAdvisor(messages: AdvisorMessage[], context: FinancialContext) {
    const response = await fetch('/api/openai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context }),
    });
    if (!response.ok) throw new Error('Failed to get advisor response');
    return response.json();
  },

  // Get spending pattern analysis
  async analyzeSpendingPatterns(transactions: any[]) {
    const response = await fetch('/api/openai/analyze-spending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions }),
    });
    if (!response.ok) throw new Error('Failed to analyze spending patterns');
    return response.json();
  },

  // Get nudge suggestions (e.g., when approaching budget limit)
  async getNudgeSuggestion(category: string, percentageUsed: number, context: FinancialContext) {
    const response = await fetch('/api/openai/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, percentageUsed, context }),
    });
    if (!response.ok) throw new Error('Failed to get nudge suggestion');
    return response.json();
  },

  // Get debt payoff recommendations
  async getDebtPayoffPlan(loans: any[], monthlyExtra: number) {
    const response = await fetch('/api/openai/debt-payoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loans, monthlyExtra }),
    });
    if (!response.ok) throw new Error('Failed to get debt payoff plan');
    return response.json();
  },

  // Get goal recommendations based on financial situation
  async getGoalRecommendations(context: FinancialContext) {
    const response = await fetch('/api/openai/goal-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    });
    if (!response.ok) throw new Error('Failed to get goal recommendations');
    return response.json();
  },
};
