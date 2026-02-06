
"use client";

import { useEffect, useState } from 'react';
import { getWallet, getTransactions, addFunds, withdrawFunds } from '@/lib/actions/wallet';
import { useUser } from '@/context/UserContext';
import { Loader2, Plus, ArrowDownToLine, ArrowUpFromLine, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function WalletPage() {
    const { user } = useUser();
    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        setError("");
        const [wRes, tRes] = await Promise.all([getWallet(), getTransactions()]);

        if (wRes.error) setError(wRes.error);
        if (wRes.success) setWallet(wRes.wallet);

        if (tRes.success) setTransactions(tRes.transactions);
        setIsLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const handleAddFunds = async () => {
        if (!amount || isNaN(parseFloat(amount))) return;
        setActionLoading(true);
        const res = await addFunds(parseFloat(amount));
        if (res.success) {
            setIsAddModalOpen(false);
            setAmount("");
            fetchData(); // Refresh
        } else {
            alert(res.error || "Failed");
        }
        setActionLoading(false);
    };

    const handleWithdraw = async () => {
        if (!amount || isNaN(parseFloat(amount))) return;
        setActionLoading(true);
        const res = await withdrawFunds(parseFloat(amount));
        if (res.success) {
            setIsWithdrawModalOpen(false);
            setAmount("");
            fetchData(); // Refresh
        } else {
            alert(res.error || "Failed");
        }
        setActionLoading(false);
    };

    if (isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (error) return <div className="p-8 text-destructive text-center">{error}</div>;

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-8">
            <h1 className="text-3xl font-bold">My Wallet</h1>

            {/* Balance Card */}
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Current Balance</h2>
                    <div className="text-5xl font-extrabold mt-2 text-primary">
                        ${wallet?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                        <span className="text-2xl text-muted-foreground ml-2 font-normal">{wallet?.currency}</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    {/* Add Funds Button - Check Payment Verification */}
                    <div className="flex flex-col items-center">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            disabled={!user?.paymentVerified}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all",
                                user?.paymentVerified ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            <Plus className="h-5 w-5" /> Add Funds
                        </button>
                        {!user?.paymentVerified && (
                            <span className="text-xs text-destructive mt-2 font-medium flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Verify Payment first
                            </span>
                        )}
                    </div>

                    {/* Withdraw Button - Check Identity Verification */}
                    <div className="flex flex-col items-center">
                        <button
                            onClick={() => setIsWithdrawModalOpen(true)}
                            disabled={!user?.identityVerified}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all border border-border",
                                user?.identityVerified ? "hover:bg-muted text-foreground" : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                            )}
                        >
                            <ArrowUpFromLine className="h-5 w-5" /> Withdraw
                        </button>
                        {!user?.identityVerified && (
                            <span className="text-xs text-destructive mt-2 font-medium flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Verify Identity first
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Transactions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Transaction History</h3>
                    <button onClick={fetchData} className="p-2 hover:bg-muted rounded-full text-muted-foreground">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {transactions.length > 0 ? (
                        <div className="divide-y divide-border">
                            {transactions.map((t) => (
                                <div key={t._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center",
                                            t.type === 'credit' ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                        )}>
                                            {t.type === 'credit' ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpFromLine className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium">{t.description}</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(t.createdAt), 'PPp')}</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "font-bold text-lg",
                                        t.type === 'credit' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    )}>
                                        {t.type === 'credit' ? '+' : '-'}${t.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-muted-foreground">
                            No transactions yet
                        </div>
                    )}
                </div>
            </div>

            {/* Modals - Simplified for MVP */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card p-6 rounded-xl w-full max-w-sm border border-border shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Add Funds</h3>
                        <input
                            type="number"
                            className="w-full p-3 border rounded-lg mb-4 bg-background"
                            placeholder="Amount (USD)"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                            <button
                                onClick={handleAddFunds}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                            >
                                {actionLoading ? "Processing..." : "Add Funds"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isWithdrawModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card p-6 rounded-xl w-full max-w-sm border border-border shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Withdraw Funds</h3>
                        <input
                            type="number"
                            className="w-full p-3 border rounded-lg mb-4 bg-background"
                            placeholder="Amount (USD)"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setIsWithdrawModalOpen(false)} className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                            <button
                                onClick={handleWithdraw}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                            >
                                {actionLoading ? "Processing..." : "Withdraw"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
