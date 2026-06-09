import { useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { PLAID_CLIENT_ID, PLAID_ENV, plaidApi } from '@/integrations/plaid/client';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UsePlaidLinkProps {
  onSuccess?: (itemId: string) => void;
  onError?: (error: Error) => void;
}

export const usePlaidAccountLink = ({ onSuccess, onError }: UsePlaidLinkProps = {}) => {
  const { toast } = useToast();

  const handlePlaidSuccess = useCallback(
    async (publicToken: string, metadata: any) => {
      try {
        // Exchange the public token for an access token
        const { accessToken } = await plaidApi.exchangePublicToken(publicToken);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Store the access token in the database (should be encrypted)
        // This is a placeholder - implement secure storage based on your backend
        const { error } = await supabase
          .from('bank_accounts')
          .insert({
            user_id: user.id,
            bank_name: metadata.institution?.name || 'Linked Account',
            account_type: metadata.accounts?.[0]?.subtype || 'checking',
            account_number: metadata.accounts?.[0]?.mask || '',
            balance: 0,
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Bank account linked successfully',
        });

        onSuccess?.(metadata.public_token);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        toast({
          title: 'Error',
          description: 'Failed to link bank account',
          variant: 'destructive',
        });
        onError?.(err);
      }
    },
    [onSuccess, onError, toast]
  );

  const handlePlaidError = useCallback(
    (error: any) => {
      const errorMessage = error?.message || 'Plaid link failed';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      onError?.(new Error(errorMessage));
    },
    [onError, toast]
  );

  const { open, ready } = usePlaidLink({
    token: '', // This would be set dynamically after creating link token
    onSuccess: handlePlaidSuccess,
    onExit: () => {
      // Handle user exit
    },
    onEvent: (eventName: string, metadata: any) => {
      console.log('Plaid event:', eventName, metadata);
    },
  });

  return {
    openPlaidLink: open,
    isPlaidReady: ready,
  };
};

// Hook to fetch and initialize Plaid Link token
export const useInitializePlaidLink = () => {
  const { toast } = useToast();

  const initializeLinkToken = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { linkToken } = await plaidApi.createLinkToken(user.id);
      return linkToken;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to initialize Plaid Link');
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  return { initializeLinkToken };
};
