import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CreditCard, History, Wallet as WalletIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const PatientWallet = () => {
    const { balance, transactions, addCredits, isLoading } = useWallet();
    const { user } = useAuth();
    const [amount, setAmount] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAddCredits = async (e: React.FormEvent) => {
        e.preventDefault();
        const creditAmount = parseFloat(amount);

        if (isNaN(creditAmount) || creditAmount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setIsProcessing(true);
        // Mock payment gateway delay
        setTimeout(async () => {
            const success = await addCredits(creditAmount, "Mock Payment Gateway Deposit");
            setIsProcessing(false);
            if (success) {
                setAmount("");
            }
        }, 1500);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <WalletIcon className="w-5 h-5" />
                    <span>Wallet ID: {user?.id.slice(0, 8)}...</span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Balance Card */}
                <Card className="bg-primary text-primary-foreground">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium opacity-90">Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{balance.toFixed(2)} Credits</div>
                        <p className="text-sm opacity-80 mt-2">Use credits to pay for consultations and medicines.</p>
                    </CardContent>
                </Card>

                {/* Add Credits Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add Credits</CardTitle>
                        <CardDescription>Top up your wallet using our secure payment gateway (Mock)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddCredits} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                    <Input
                                        id="amount"
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="pl-7"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        disabled={isProcessing}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isProcessing || !amount}>
                                {isProcessing ? (
                                    "Processing..."
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        Pay Now
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions History */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        <CardTitle>Transaction History</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        No transactions found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((txn) => (
                                    <TableRow key={txn.id}>
                                        <TableCell>{format(new Date(txn.created_at), "MMM d, yyyy h:mm a")}</TableCell>
                                        <TableCell className="capitalize">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${['deposit', 'refund', 'consultation_credit'].includes(txn.type)
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                                }`}>
                                                {txn.type.replace(/_/g, ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell>{txn.description}</TableCell>
                                        <TableCell className={`text-right font-medium ${['deposit', 'refund', 'consultation_credit'].includes(txn.type) ? "text-green-600" : "text-red-600"
                                            }`}>
                                            {['deposit', 'refund', 'consultation_credit'].includes(txn.type) ? "+" : "-"}{Math.abs(txn.amount).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default PatientWallet;
