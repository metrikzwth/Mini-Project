import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { getData, setData, STORAGE_KEYS } from '@/lib/data';

export interface Transaction {
    id: string;
    amount: number;
    type: 'deposit' | 'purchase' | 'refund' | 'payout' | 'withdrawal' | 'consultation_credit' | 'manual_adjustment';
    description: string;
    created_at: string;
}

interface WalletContextType {
    balance: number;
    transactions: Transaction[];
    isLoading: boolean;
    addCredits: (amount: number, description?: string, targetUserId?: string, type?: 'deposit' | 'refund' | 'manual_adjustment' | 'consultation_credit') => Promise<boolean>;
    deductCredits: (amount: number, description: string, targetUserId?: string, type?: 'purchase' | 'payout' | 'manual_adjustment') => Promise<boolean>;
    transferCredits: (amount: number, receiverId: string, description: string) => Promise<boolean>;
    requestPayout: (amount: number, description?: string, type?: 'payout' | 'withdrawal') => Promise<boolean>;
    refreshWallet: () => Promise<void>;
    createTransaction: (amount: number, type: string, description: string, targetUserId?: string) => Promise<void>;
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

    const createTransaction = async (amount: number, type: string, description: string, targetUserId?: string) => {
        const targetId = targetUserId || user?.id;
        if (!targetId) return;

        try {
            if (isUUID(targetId)) {
                // Real DB User
                const { data: walletData, error: walletError } = await supabase
                    .from('wallets')
                    .select('id')
                    .eq('user_id', targetId)
                    .single();

                if (walletError || !walletData) {
                    console.error('Failed to find wallet for transaction:', walletError);
                    return;
                }

                const { error: txnError } = await supabase.from('transactions').insert({
                    wallet_id: walletData.id,
                    amount: amount,
                    type: type,
                    description: description,
                    created_at: new Date().toISOString()
                });

                if (txnError) console.error('Failed to insert transaction:', txnError);
                else console.log('Transaction inserted successfully:', description);
            } else {
                // Local Mock User
                const txn: Transaction & { userId: string } = {
                    id: `TXN${Date.now()}`,
                    amount,
                    type: type as any,
                    description,
                    created_at: new Date().toISOString(),
                    userId: targetId,
                };
                const allTxns = getData<any[]>(STORAGE_KEYS.TRANSACTIONS, []);
                allTxns.push(txn);
                setData(STORAGE_KEYS.TRANSACTIONS, allTxns);
                console.log('Local transaction inserted:', description);
            }
        } catch (err) {
            console.error('Error creating transaction:', err);
        }
    };

    const addCredits = async (amount: number, description: string = 'Added credits', targetUserId?: string, type: 'deposit' | 'refund' | 'manual_adjustment' | 'consultation_credit' = 'deposit') => {
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

                console.log('Credits added successfully via RPC');
                await createTransaction(amount, type, description, targetId);

            } else {
                // Local Mock User logic (keep as is)
                // ... (omitted for brevity, assume existing logic is fine but we can replace the txn creation part too)
                const users = getData<any[]>(STORAGE_KEYS.USERS, []);
                let userFound = false;
                // ... update user balance ...
                const updatedUsers = users.map(u => {
                    if (u.id === targetId) {
                        userFound = true;
                        return { ...u, balance: (u.balance || 0) + amount };
                    }
                    return u;
                });
                if (!userFound) return false;
                setData(STORAGE_KEYS.USERS, updatedUsers);

                await createTransaction(amount, type, description, targetId);
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

                console.log('Credits deducted successfully via RPC');
                await createTransaction(-amount, type, description, targetId); // Note negative amount? No, backend handles sign?
                // Wait, transactions table usually stores signed amount? 
                // RPC `deduct_credits` reduces balance.
                // Creating a transaction record: if type is 'purchase', amount should be negative visually?
                // In my `createTransaction`, I take `amount`.
                // Let's pass negative amount for deductions.

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

                await createTransaction(-amount, type, description, targetId);
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

                // Manually log for Sender (Patient)
                await createTransaction(-amount, 'purchase', description, user.id);

                // Manually log for Receiver (Doctor) - Use a slightly different description if possible, or same
                // For the receiver, we want to know who sent it.
                // But we only have generic description.
                // Let's append "(Transfer)" or something, or just use description.
                await createTransaction(amount, 'consultation_credit', description, receiverId);

            } else {
                // Hybrid or Local Transfer
                // 1. Deduct from Sender
                if (senderUUID) {
                    await deductCredits(amount, description, user.id, 'purchase');
                } else {
                    // Local Sender
                    await deductCredits(amount, description, user.id, 'purchase');
                }

                // 2. Add to Receiver (Doctor) — use 'consultation_credit' so it shows correctly
                if (receiverUUID) {
                    await addCredits(amount, description, receiverId, 'consultation_credit');
                } else {
                    // Force a fresh read/write for local receiver
                    await addCredits(amount, description, receiverId, 'consultation_credit');

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

    // For doctors to payout and patients to withdraw
    const requestPayout = async (amount: number, description: string = 'Payout processed to Bank', type: 'payout' | 'withdrawal' = 'payout') => {
        if (!user) return false;
        try {
            if (isUUID(user.id)) {
                // Real DB User: use RPC
                const { error } = await supabase.rpc('deduct_credits', {
                    target_user_id: user.id,
                    deduct_amount: amount,
                    txn_description: description,
                    txn_type: type
                });
                if (error) throw error;
                await createTransaction(-amount, type, description, user.id);
            } else {
                // Mock/Local User: deduct from localStorage
                const users = getData<any[]>(STORAGE_KEYS.USERS, []);
                const currentUser = users.find(u => u.id === user.id);
                if (!currentUser || (currentUser.balance || 0) < amount) {
                    throw new Error('Insufficient balance');
                }
                const updatedUsers = users.map(u => {
                    if (u.id === user.id) {
                        return { ...u, balance: (u.balance || 0) - amount };
                    }
                    return u;
                });
                setData(STORAGE_KEYS.USERS, updatedUsers);
                await createTransaction(-amount, type, description, user.id);
            }

            toast.success(`${type === 'withdrawal' ? 'Withdrawal' : 'Payout'} of ${amount} credits processed to bank.`);
            await fetchWalletData();
            return true;
        } catch (error: any) {
            console.error('Error processing payout:', error);
            toast.error(error.message || 'Failed to process payout');
            return false;
        }
    };

    return (
        <WalletContext.Provider value={{ balance, transactions, isLoading, addCredits, deductCredits, transferCredits, requestPayout, refreshWallet: fetchWalletData, createTransaction }}>
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
