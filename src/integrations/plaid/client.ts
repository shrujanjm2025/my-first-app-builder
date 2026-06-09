// Plaid Integration
// This file handles the Plaid API client configuration for backend communication

export const PLAID_CLIENT_ID = import.meta.env.VITE_PLAID_CLIENT_ID;
export const PLAID_ENV = (import.meta.env.VITE_PLAID_ENV || 'sandbox') as 'sandbox' | 'development' | 'production';

if (!PLAID_CLIENT_ID || PLAID_CLIENT_ID === 'YOUR_PLAID_CLIENT_ID') {
  console.warn('Plaid Client ID not configured. Please set VITE_PLAID_CLIENT_ID in your environment variables.');
}

// Plaid API endpoints (called from the backend)
export const plaidApi = {
  // Create a link token for the Plaid Link flow
  async createLinkToken(userId: string) {
    const response = await fetch('/api/plaid/create-link-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error('Failed to create Plaid link token');
    return response.json();
  },

  // Exchange public token for access token
  async exchangePublicToken(publicToken: string) {
    const response = await fetch('/api/plaid/exchange-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicToken }),
    });
    if (!response.ok) throw new Error('Failed to exchange Plaid token');
    return response.json();
  },

  // Get transactions for a linked account
  async getTransactions(accessToken: string, startDate: string, endDate: string) {
    const response = await fetch('/api/plaid/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, startDate, endDate }),
    });
    if (!response.ok) throw new Error('Failed to fetch Plaid transactions');
    return response.json();
  },
};
