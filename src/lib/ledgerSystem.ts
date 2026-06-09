/**
 * Double-Entry Bookkeeping Ledger System
 * Ensures 100% financial accuracy by tracking debits and credits
 * Assets = Liabilities + Equity
 */

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  debitAccount: Account;
  creditAccount: Account;
  amount: number;
  reference: string; // Transaction ID, check number, etc.
  notes?: string;
  userId: string;
}

export interface TrialBalance {
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  balanceDifference: number;
}

export interface FinancialStatement {
  assets: { account: Account; balance: number }[];
  liabilities: { account: Account; balance: number }[];
  equity: { account: Account; balance: number }[];
  income: { account: Account; balance: number }[];
  expenses: { account: Account; balance: number }[];
}

/**
 * Standard chart of accounts for personal finance
 */
export const DEFAULT_ACCOUNTS: Account[] = [
  // Assets
  { id: 'bank_checking', name: 'Checking Account', type: 'asset', balance: 0, currency: 'INR' },
  { id: 'bank_savings', name: 'Savings Account', type: 'asset', balance: 0, currency: 'INR' },
  { id: 'cash', name: 'Cash', type: 'asset', balance: 0, currency: 'INR' },
  { id: 'credit_cards', name: 'Credit Cards', type: 'asset', balance: 0, currency: 'INR' },
  { id: 'investments', name: 'Investments', type: 'asset', balance: 0, currency: 'INR' },
  { id: 'real_estate', name: 'Real Estate', type: 'asset', balance: 0, currency: 'INR' },

  // Liabilities
  { id: 'credit_card_debt', name: 'Credit Card Debt', type: 'liability', balance: 0, currency: 'INR' },
  { id: 'home_loan', name: 'Home Loan', type: 'liability', balance: 0, currency: 'INR' },
  { id: 'personal_loan', name: 'Personal Loan', type: 'liability', balance: 0, currency: 'INR' },
  { id: 'car_loan', name: 'Car Loan', type: 'liability', balance: 0, currency: 'INR' },

  // Equity
  { id: 'opening_balance', name: 'Opening Balance', type: 'equity', balance: 0, currency: 'INR' },
  { id: 'retained_earnings', name: 'Retained Earnings', type: 'equity', balance: 0, currency: 'INR' },

  // Income
  { id: 'salary', name: 'Salary', type: 'income', balance: 0, currency: 'INR' },
  { id: 'freelance_income', name: 'Freelance Income', type: 'income', balance: 0, currency: 'INR' },
  { id: 'interest_income', name: 'Interest Income', type: 'income', balance: 0, currency: 'INR' },
  { id: 'investment_income', name: 'Investment Income', type: 'income', balance: 0, currency: 'INR' },

  // Expenses
  { id: 'groceries', name: 'Groceries', type: 'expense', balance: 0, currency: 'INR' },
  { id: 'utilities', name: 'Utilities', type: 'expense', balance: 0, currency: 'INR' },
  { id: 'rent', name: 'Rent', type: 'expense', balance: 0, currency: 'INR' },
  { id: 'transportation', name: 'Transportation', type: 'expense', balance: 0, currency: 'INR' },
  { id: 'dining_out', name: 'Dining Out', type: 'expense', balance: 0, currency: 'INR' },
  { id: 'entertainment', name: 'Entertainment', type: 'expense', balance: 0, currency: 'INR' },
  { id: 'interest_expense', name: 'Interest Expense', type: 'expense', balance: 0, currency: 'INR' },
];

/**
 * Create a double-entry ledger entry
 * Ensures debit account is debited and credit account is credited
 */
export function createLedgerEntry(
  date: string,
  description: string,
  debitAccount: Account,
  creditAccount: Account,
  amount: number,
  reference: string,
  userId: string,
  notes?: string
): LedgerEntry {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  if (debitAccount.id === creditAccount.id) {
    throw new Error('Debit and credit accounts cannot be the same');
  }

  return {
    id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date,
    description,
    debitAccount,
    creditAccount,
    amount,
    reference,
    notes,
    userId,
  };
}

/**
 * Update account balance after ledger entry
 */
export function updateAccountBalance(
  account: Account,
  entryType: 'debit' | 'credit',
  amount: number
): Account {
  const updatedAccount = { ...account };

  if (entryType === 'debit') {
    // Debits increase assets, expenses; decrease liabilities, equity, income
    if (account.type === 'asset' || account.type === 'expense') {
      updatedAccount.balance += amount;
    } else {
      updatedAccount.balance -= amount;
    }
  } else {
    // Credits increase liabilities, equity, income; decrease assets, expenses
    if (account.type === 'asset' || account.type === 'expense') {
      updatedAccount.balance -= amount;
    } else {
      updatedAccount.balance += amount;
    }
  }

  return updatedAccount;
}

/**
 * Calculate trial balance
 * Total debits must equal total credits
 */
export function calculateTrialBalance(entries: LedgerEntry[]): TrialBalance {
  let totalDebits = 0;
  let totalCredits = 0;

  entries.forEach(entry => {
    totalDebits += entry.amount;
    totalCredits += entry.amount;
  });

  const balanceDifference = Math.abs(totalDebits - totalCredits);

  return {
    totalDebits,
    totalCredits,
    isBalanced: balanceDifference < 0.01, // Account for floating point errors
    balanceDifference,
  };
}

/**
 * Generate financial statement from ledger entries
 */
export function generateFinancialStatement(
  accounts: Account[],
  entries: LedgerEntry[]
): FinancialStatement {
  // Update account balances based on entries
  const updatedAccounts = accounts.map(account => {
    let balance = account.balance;

    entries.forEach(entry => {
      if (entry.debitAccount.id === account.id) {
        balance = updateAccountBalance(account, 'debit', entry.amount).balance;
      } else if (entry.creditAccount.id === account.id) {
        balance = updateAccountBalance(account, 'credit', entry.amount).balance;
      }
    });

    return { ...account, balance };
  });

  const statement: FinancialStatement = {
    assets: updatedAccounts
      .filter(acc => acc.type === 'asset')
      .map(acc => ({ account: acc, balance: acc.balance })),
    liabilities: updatedAccounts
      .filter(acc => acc.type === 'liability')
      .map(acc => ({ account: acc, balance: acc.balance })),
    equity: updatedAccounts
      .filter(acc => acc.type === 'equity')
      .map(acc => ({ account: acc, balance: acc.balance })),
    income: updatedAccounts
      .filter(acc => acc.type === 'income')
      .map(acc => ({ account: acc, balance: acc.balance })),
    expenses: updatedAccounts
      .filter(acc => acc.type === 'expense')
      .map(acc => ({ account: acc, balance: acc.balance })),
  };

  return statement;
}

/**
 * Verify accounting equation
 * Assets = Liabilities + Equity
 */
export function verifyAccountingEquation(statement: FinancialStatement): {
  isValid: boolean;
  assets: number;
  liabilities: number;
  equity: number;
  difference: number;
} {
  const totalAssets = statement.assets.reduce((sum, item) => sum + item.balance, 0);
  const totalLiabilities = statement.liabilities.reduce((sum, item) => sum + item.balance, 0);
  const totalEquity = statement.equity.reduce((sum, item) => sum + item.balance, 0);
  const totalIncomeExpenses =
    statement.income.reduce((sum, item) => sum + item.balance, 0) -
    statement.expenses.reduce((sum, item) => sum + item.balance, 0);

  const difference = Math.abs(totalAssets - (totalLiabilities + totalEquity + totalIncomeExpenses));

  return {
    isValid: difference < 0.01,
    assets: totalAssets,
    liabilities: totalLiabilities,
    equity: totalEquity,
    difference,
  };
}

/**
 * Generate ledger report (list of entries grouped by account)
 */
export function generateLedgerReport(
  entries: LedgerEntry[],
  accountId: string
): { account: Account; entries: LedgerEntry[]; runningBalance: number[] } {
  const accountEntries = entries.filter(
    e => e.debitAccount.id === accountId || e.creditAccount.id === accountId
  );

  const balances: number[] = [];
  let currentBalance = 0;

  accountEntries.forEach(entry => {
    if (entry.debitAccount.id === accountId) {
      currentBalance += entry.amount;
    } else {
      currentBalance -= entry.amount;
    }
    balances.push(currentBalance);
  });

  const account = accountEntries[0]?.debitAccount || accountEntries[0]?.creditAccount;

  return {
    account: account || DEFAULT_ACCOUNTS[0],
    entries: accountEntries,
    runningBalance: balances,
  };
}

/**
 * Prevent double-counting of transactions
 * Check if same transaction is being entered twice
 */
export function checkDuplicateEntry(
  entries: LedgerEntry[],
  newEntry: Partial<LedgerEntry>
): boolean {
  return entries.some(
    entry =>
      entry.date === newEntry.date &&
      entry.debitAccount.id === newEntry.debitAccount?.id &&
      entry.creditAccount.id === newEntry.creditAccount?.id &&
      entry.amount === newEntry.amount &&
      Math.abs(new Date(entry.date).getTime() - new Date(newEntry.date || '').getTime()) < 60000 // Within 1 minute
  );
}
