import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { getData, setData, STORAGE_KEYS } from '@/lib/data';

export interface Transaction {
    id: string;
    amount: number;
    type: 'deposit' | 'purchase' | 'refund' | 'payout' | 'consultation_credit' | 'manual_adjustment';
    description: string;
    created_at: string;
}

interface WalletContextType {
    balance: number;
    transactions: Transaction[];
    isLoading: boolean;
    addCredits: (amount: number, description?: string, targetUserId?: string, type?: 'deposit' | 'refund' | 'manual_adjustment') => Promise<boolean>;
    deductCredits: (amount: number, description: string, targetUserId?: string, type?: 'purchase' | 'payout' | 'manual_adjustment') => Promise<boolean>;
    transferCredits: (amount: number, receiverId: string, description: string) => Promise<boolean>;
    requestPayout: (amount: number) => Promise<boolean>;
    refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchWalletData();

            // Listen for local data updates (dispatched by setData)
            const handleLocalUpdate = () => {
                fetchWalletData();
            };
            window.addEventListener('localDataUpdate', handleLocalUpdate);
            // Also listen for storage events (cross-tab)
            window.addEventListener('storage', handleLocalUpdate);

            // Listen for BroadcastChannel updates
            const channel = new BroadcastChannel('medicare_data_updates');
            channel.onmessage = (event) => {
                if (event.data.type === 'update') {
                    console.log('[WalletContext] Received broadcast update:', event.data);
                    fetchWalletData();
                }
            };

            // Supabase Subscription
            let subscription: any = null;
            if (isUUID(user.id)) {
                subscription = supabase
                    .channel('wallet_updates')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'wallets',
                            filter: `user_id=eq.${user.id}`,
                        },
                        (payload) => {
                            console.log('Wallet update received:', payload);
                            fetchWalletData();
                        }
                    )
                    .subscribe();
            }

            return () => {
                window.removeEventListener('localDataUpdate', handleLocalUpdate);
                window.removeEventListener('storage', handleLocalUpdate);
                channel.close();
                if (subscription) {
                    supabase.removeChannel(subscription);
                }
            };
        } else {
            setBalance(0);
            setTransactions([]);
        }
    }, [user]);

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    const fetchWalletData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            if (isUUID(user.id)) {
                // Fetch Wallet from Supabase
                const { data: wallet, error: walletError } = await supabase
                    .from('wallets')
                    .select('id, balance')
                    .eq('user_id', user.id)
                    .single();

                if (walletError && walletError.code !== 'PGRST116') {
                    console.error('Error fetching wallet:', walletError);
                }

                if (wallet) {
                    setBalance(wallet.balance);
                    // Fetch Transactions
                    const { data: txns, error: txnError } = await supabase
                        .from('transactions')
                        .select('*')
                        .eq('wallet_id', wallet.id)
                        .order('created_at', { ascending: false });

                    if (txnError) {
                        console.error('Error fetching transactions:', txnError);
                    } else {
                        setTransactions(txns || []);
                    }
                }
            } else {
                // Fallback: Local Storage for Mock Users
                const users = getData<any[]>(STORAGE_KEYS.USERS, []);
                const currentUser = users.find(u => u.id === user.id);
                setBalance(currentUser?.balance || 0);

                // Read local transactions for this user
                const allLocalTxns = getData<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
                const userTxns = allLocalTxns
                    .filter(t => (t as any).userId === user.id)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setTransactions(userTxns);
            }

        } catch (error) {
            console.error('Error in fetchWalletData:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addCredits = async (amount: number, description: string = 'Added credits', targetUserId?: string, type: 'deposit' | 'refund' | 'manual_adjustment' = 'deposit') => {
        const targetId = targetUserId || user?.id;
        if (!targetId) return false;

        try {
            if (isUUID(targetId)) {
                // Real DB User
                const { error } = await supabase.rpc('add_credits', {
                    target_user_id: targetId,
                    credit_amount: amount,
                    txn_description: description,
                    txn_type: type
                });
                if (error) throw error;
            } else {
                // Local Mock User
                const users = getData<any[]>(STORAGE_KEYS.USERS, []);
                let userFound = false;
                const updatedUsers = users.map(u => {
                    if (u.id === targetId) {
                        userFound = true;
                        return { ...u, balance: (u.balance || 0) + amount };
                    }
                    return u;
                });

                if (!userFound) {
                    console.error(`User ${targetId} not found in local storage during credit addition.`);
                    toast.error(`Transfer failed: Recipient user (${targetId}) not found.`);
                    return false;
                }

                setData(STORAGE_KEYS.USERS, updatedUsers);

                // Record transaction in localStorage
                const txn: Transaction & { userId: string } = {
                    id: `TXN${Date.now()}`,
                    amount,
                    type,
                    description,
                    created_at: new Date().toISOString(),
                    userId: targetId,
                };
                const allTxns = getData<any[]>(STORAGE_KEYS.TRANSACTIONS, []);
                allTxns.push(txn);
                setData(STORAGE_KEYS.TRANSACTIONS, allTxns);
            }

            if (!targetUserId || targetUserId === user?.id) {
                await fetchWalletData();
            }
            return true;
        } catch (error: any) {
            console.error('Error adding credits:', error);
            toast.error(error.message || 'Failed to add credits');
            return false;
        }
    };

    const deductCredits = async (amount: number, description: string, targetUserId?: string, type: 'purchase' | 'payout' | 'manual_adjustment' = 'purchase') => {
        const targetId = targetUserId || user?.id;
        if (!targetId) return false;

        try {
            if (isUUID(targetId)) {
                // Real DB User
                const { error } = await supabase.rpc('deduct_credits', {
                    target_user_id: targetId,
                    deduct_amount: amount,
                    txn_description: description,
                    txn_type: type
                });
                if (error) throw error;
            } else {
                // Local Mock User
                const users = getData<any[]>(STORAGE_KEYS.USERS, []);
                const currentUser = users.find(u => u.id === targetId);
                if ((currentUser?.balance || 0) < amount) {
                    throw new Error("Insufficient balance (Mock)");
                }

                const updatedUsers = users.map(u => {
                    if (u.id === targetId) {
                        return { ...u, balance: (u.balance || 0) - amount };
                    }
                    return u;
                });
                setData(STORAGE_KEYS.USERS, updatedUsers);

                // Record transaction in localStorage
                const txn: Transaction & { userId: string } = {
                    id: `TXN${Date.now()}`,
                    amount: -amount,
                    type,
                    description,
                    created_at: new Date().toISOString(),
                    userId: targetId,
                };
                const allTxns = getData<any[]>(STORAGE_KEYS.TRANSACTIONS, []);
                allTxns.push(txn);
                setData(STORAGE_KEYS.TRANSACTIONS, allTxns);
            }

            if (!targetUserId || targetUserId === user?.id) {
                await fetchWalletData();
            }
            return true;
        } catch (error: any) {
            console.error('Error deducting credits:', error);
            toast.error(error.message || 'Failed to deduct credits');
            return false;
        }
    };

    const transferCredits = async (amount: number, receiverId: string, description: string) => {
        if (!user) return false;
        try {
            const senderUUID = isUUID(user.id);
            const receiverUUID = isUUID(receiverId);

            if (senderUUID && receiverUUID) {
                // Both Real: Database Transfer
                const { error } = await supabase.rpc('transfer_credits', {
                    sender_id: user.id,
                    receiver_id: receiverId,
                    amount: amount,
                    description: description,
                    sender_txn_type: 'purchase',
                    receiver_txn_type: 'consultation_credit'
                });
                if (error) throw error;
            } else {
                // Hybrid or Local Transfer
                // 1. Deduct from Sender
                if (senderUUID) {
                    await deductCredits(amount, description, user.id, 'purchase');
                } else {
                    // Local Sender
                    await deductCredits(amount, description, user.id, 'purchase');
                }

                // 2. Add to Receiver
                if (receiverUUID) {
                    await addCredits(amount, description, receiverId, 'manual_adjustment');
                } else {
                    // Force a fresh read/write for local receiver
                    await addCredits(amount, description, receiverId, 'manual_adjustment');

                    // Explicitly broadcast update for the receiver if it's not the current user
                    // This ensures Admin tab picks it up if it's open
                    if (receiverId !== user.id) {
                        const channel = new BroadcastChannel('medicare_data_updates');
                        channel.postMessage({ type: 'update', key: 'medicare_users' });
                        channel.close();
                    }
                }
            }

            await fetchWalletData();
            return true;
        } catch (error: any) {
            console.error('Error transferring credits:', error);
            toast.error(error.message || 'Failed to transfer credits');
            return false;
        }
    };

    // For doctors to payout
    const requestPayout = async (amount: number) => {
        if (!user) return false;
        try {
            // Payout resets balance to 0 (or deducts specific amount)
            // The user requested "balance will be 0 itself after transfer"
            // So we deduct the FULL current balance if amount matches, or just the requested amount.

            const { error } = await supabase.rpc('deduct_credits', {
                target_user_id: user.id,
                deduct_amount: amount,
                txn_description: 'Payout processed to Bank',
                txn_type: 'payout'
            });

            if (error) throw error;

            toast.success(`Payout of ${amount} credits processed to bank.`);
            await fetchWalletData();
            return true;
        } catch (error: any) {
            console.error('Error processing payout:', error);
            toast.error(error.message || 'Failed to process payout');
            return false;
        }
    };

    return (
        <WalletContext.Provider value={{ balance, transactions, isLoading, addCredits, deductCredits, transferCredits, requestPayout, refreshWallet: fetchWalletData }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
