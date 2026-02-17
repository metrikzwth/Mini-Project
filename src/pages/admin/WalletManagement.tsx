import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Wallet, Search, Edit2, Settings, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface UserWallet {
    id: string;
    balance: number;
    user_id: string;
    profiles: {
        full_name: string;
        email: string;
        role: string;
    };
}

const WalletManagement = () => {
    const navigate = useNavigate();
    const [wallets, setWallets] = useState<UserWallet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Conversion Rate State
    const [conversionRate, setConversionRate] = useState<string>('1.0');
    const [loadingRate, setLoadingRate] = useState(false);

    // Dialog State
    const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchWallets();
        fetchConversionRate();
    }, []);

    const fetchWallets = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('wallets')
            .select('*, profiles(full_name, email, role)');

        if (error) {
            console.error('Error fetching wallets:', error);
            toast.error('Failed to load wallets');
        } else {
            setWallets(data as any);
        }
        setLoading(false);
    };

    const fetchConversionRate = async () => {
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'credit_conversion_rate')
            .single();

        if (data) {
            setConversionRate(data.value);
        }
    };

    const updateConversionRate = async () => {
        setLoadingRate(true);
        const { error } = await supabase
            .from('system_settings')
            .upsert({ key: 'credit_conversion_rate', value: conversionRate });

        if (error) {
            toast.error('Failed to update rate');
        } else {
            toast.success('Conversion rate updated');
        }
        setLoadingRate(false);
    };

    const handleAdjustment = async () => {
        if (!selectedWallet || !adjustmentAmount) return;

        setProcessing(true);
        const amount = parseFloat(adjustmentAmount);

        if (isNaN(amount) || amount <= 0) {
            toast.error('Invalid amount');
            setProcessing(false);
            return;
        }

        const description = `Admin Adjustment: ${adjustmentType === 'add' ? 'Credit' : 'Debit'}`;
        const rpcName = adjustmentType === 'add' ? 'add_credits' : 'deduct_credits';

        const params: any = {
            target_user_id: selectedWallet.user_id, // RPC expects target_user_id
            txn_description: description
        };

        if (adjustmentType === 'add') {
            params.credit_amount = amount;
        } else {
            params.deduct_amount = amount;
            params.txn_type = 'manual_adjustment';
        }

        const { error } = await supabase.rpc(rpcName, params);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Balance updated successfully');
            setSelectedWallet(null);
            setAdjustmentAmount('');
            fetchWallets();
        }
        setProcessing(false);
    };

    const filteredWallets = wallets.filter(w =>
        w.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background flex">
            <AdminSidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-3xl font-bold">Wallet Management</h1>
                    </div>
                </div>

                <div className="grid gap-6 mb-6">
                    {/* System Settings Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5" /> System Settings
                            </CardTitle>
                            <CardDescription>Manage global wallet configurations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-4 max-w-sm">
                                <div className="space-y-2 flex-1">
                                    <label className="text-sm font-medium">Credit Conversion Rate</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-2.5 text-muted-foreground text-sm">1 Credit = </div>
                                        <Input
                                            value={conversionRate}
                                            onChange={(e) => setConversionRate(e.target.value)}
                                            className="pl-20"
                                            placeholder="1.0"
                                        />
                                        <div className="absolute right-3 top-2.5 text-muted-foreground text-sm">Currency</div>
                                    </div>
                                </div>
                                <Button onClick={updateConversionRate} disabled={loadingRate}>
                                    <Save className="w-4 h-4 mr-2" />
                                    {loadingRate ? 'Saving...' : 'Save Rate'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* User Balances Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>User Balances</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <Search className="text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="max-w-sm"
                                />
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
                                            </TableRow>
                                        ) : filteredWallets.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No users found</TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredWallets.map((wallet) => (
                                                <TableRow key={wallet.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{wallet.profiles?.full_name || 'N/A'}</div>
                                                        <div className="text-sm text-muted-foreground">{wallet.profiles?.email}</div>
                                                    </TableCell>
                                                    <TableCell className="capitalize">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${wallet.profiles?.role === 'doctor'
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-gray-100 text-gray-800"
                                                            }`}>
                                                            {wallet.profiles?.role}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-medium">{wallet.balance.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline" size="sm" onClick={() => setSelectedWallet(wallet)}>
                                                                    <Edit2 className="w-4 h-4 mr-2" /> Adjust
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Adjust Balance</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="py-4 space-y-4">
                                                                    <div className="p-3 bg-muted rounded-lg">
                                                                        <p className="text-sm font-medium">User: {wallet.profiles?.full_name}</p>
                                                                        <p className="text-sm text-muted-foreground">Current Balance: {wallet.balance.toFixed(2)}</p>
                                                                    </div>

                                                                    <div className="flex gap-4">
                                                                        <Button
                                                                            type="button"
                                                                            variant={adjustmentType === 'add' ? 'default' : 'outline'}
                                                                            onClick={() => setAdjustmentType('add')}
                                                                            className="flex-1"
                                                                        >
                                                                            Add Credit
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant={adjustmentType === 'remove' ? 'destructive' : 'outline'}
                                                                            onClick={() => setAdjustmentType('remove')}
                                                                            className="flex-1"
                                                                        >
                                                                            Remove Credit
                                                                        </Button>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <label className="text-sm font-medium">Amount</label>
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="0.00"
                                                                            value={adjustmentAmount}
                                                                            onChange={(e) => setAdjustmentAmount(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button onClick={handleAdjustment} disabled={processing} className="w-full">
                                                                        {processing ? 'Processing...' : 'Confirm Adjustment'}
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default WalletManagement;
