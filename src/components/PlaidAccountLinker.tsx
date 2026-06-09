import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface LinkedAccount {
  id: string;
  bank_name: string;
  account_type: string;
  account_number?: string;
  balance: number;
  created_at: string;
}

interface PlaidAccountLinkerProps {
  userId: string;
  onAccountsChange?: (accounts: LinkedAccount[]) => void;
}

export const PlaidAccountLinker: React.FC<PlaidAccountLinkerProps> = ({
  userId,
  onAccountsChange,
}) => {
  const { toast } = useToast();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);

  // Fetch linked accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLinkedAccounts(data || []);
        onAccountsChange?.(data || []);
      } catch (error) {
        console.error('Failed to fetch bank accounts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load linked accounts',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [userId, onAccountsChange, toast]);

  // Open Plaid Link (would be connected to actual Plaid Link component in production)
  const handleOpenPlaidLink = async () => {
    try {
      setIsLinking(true);
      // In production, this would trigger the Plaid Link modal
      // For now, we'll simulate a successful connection
      
      // Create a mock bank account for demonstration
      const mockAccount: LinkedAccount = {
        id: `mock_${Date.now()}`,
        bank_name: 'Demo Bank',
        account_type: 'checking',
        account_number: '**** **** **** 4242',
        balance: 50000,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: userId,
          bank_name: mockAccount.bank_name,
          account_type: mockAccount.account_type,
          account_number: mockAccount.account_number,
          balance: mockAccount.balance,
        });

      if (error) throw error;

      setLinkedAccounts(prev => [mockAccount, ...prev]);
      onAccountsChange?.([mockAccount, ...linkedAccounts]);

      toast({
        title: 'Success',
        description: 'Bank account linked successfully',
      });
    } catch (error) {
      console.error('Failed to link account:', error);
      toast({
        title: 'Error',
        description: 'Failed to link bank account',
        variant: 'destructive',
      });
    } finally {
      setIsLinking(false);
    }
  };

  // Remove linked account
  const handleRemoveAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      const updated = linkedAccounts.filter(acc => acc.id !== accountId);
      setLinkedAccounts(updated);
      onAccountsChange?.(updated);

      toast({
        title: 'Success',
        description: 'Bank account removed',
      });
    } catch (error) {
      console.error('Failed to remove account:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove bank account',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Linked Accounts */}
      <div className="space-y-3">
        {linkedAccounts.length > 0 ? (
          linkedAccounts.map(account => (
            <div
              key={account.id}
              className="bg-card border border-border rounded-xl p-4 flex items-start justify-between hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground">{account.bank_name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account
                  </p>
                  {account.account_number && (
                    <p className="text-xs text-muted-foreground font-mono">{account.account_number}</p>
                  )}
                  <p className="text-sm font-mono font-bold text-foreground mt-2">
                    ₹{account.balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveAccount(account.id)}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Remove account"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="bg-secondary/50 border border-dashed border-border rounded-xl p-6 text-center">
            <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">No linked accounts</p>
            <p className="text-xs text-muted-foreground">
              Link a bank account to start tracking transactions automatically
            </p>
          </div>
        )}
      </div>

      {/* Link Account Button */}
      <Button
        onClick={handleOpenPlaidLink}
        disabled={isLinking}
        variant="outline"
        className="w-full"
      >
        {isLinking ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Linking...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Link Bank Account
          </>
        )}
      </Button>

      {/* Info message */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-primary">Secure:</span> Your banking credentials are never stored on our servers. 
          We use Plaid to securely connect to your bank.
        </p>
      </div>
    </div>
  );
};
