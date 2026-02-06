
"use server";

import connectToDatabase from "@/lib/db";
import Wallet from "@/models/Wallet";
import Transaction from "@/models/Transaction";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getWallet() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();
        const wallet = await Wallet.findOne({ userId: session.user.id });
        if (!wallet) {
            // Fallback: create if missing (should exist from signup, but safe to have)
            const newWallet = await Wallet.create({
                userId: session.user.id,
                username: session.user.username || "User",
                balance: 0
            });
            return { success: true, wallet: JSON.parse(JSON.stringify(newWallet)) };
        }
        return { success: true, wallet: JSON.parse(JSON.stringify(wallet)) };
    } catch (error) {
        console.error("Error fetching wallet:", error);
        return { error: "Failed to fetch wallet" };
    }
}

export async function getTransactions() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();
        const wallet = await Wallet.findOne({ userId: session.user.id });
        if (!wallet) return { error: "Wallet not found" };

        const transactions = await Transaction.find({ walletId: wallet._id })
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50

        return { success: true, transactions: JSON.parse(JSON.stringify(transactions)) };
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return { error: "Failed to fetch transactions" };
    }
}

export async function addFunds(amount: number) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    if (amount <= 0) return { error: "Invalid amount" };

    try {
        await connectToDatabase();
        const wallet = await Wallet.findOne({ userId: session.user.id });
        if (!wallet) return { error: "Wallet not found" };

        // In a real app, verify payment here. 
        // For MVP/Demo: Assume verified if UI allowed it (or check user status again)

        // Update balance
        wallet.balance += amount;
        await wallet.save();

        // Log transaction
        await Transaction.create({
            walletId: wallet._id,
            type: "credit",
            amount: amount,
            reason: "add_funds",
            description: "Added funds via Mock Payment",
        });

        revalidatePath("/wallet");
        return { success: true, newBalance: wallet.balance };
    } catch (error) {
        console.error("Error adding funds:", error);
        return { error: "Failed to add funds" };
    }
}

export async function withdrawFunds(amount: number) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    if (amount <= 0) return { error: "Invalid amount" };

    try {
        await connectToDatabase();
        const wallet = await Wallet.findOne({ userId: session.user.id });
        if (!wallet) return { error: "Wallet not found" };

        if (wallet.balance < amount) {
            return { error: "Insufficient funds" };
        }

        // Update balance
        wallet.balance -= amount;
        await wallet.save();

        // Log transaction
        await Transaction.create({
            walletId: wallet._id,
            type: "debit",
            amount: amount,
            reason: "withdraw",
            description: "Withdrew funds",
        });

        revalidatePath("/wallet");
        return { success: true, newBalance: wallet.balance };
    } catch (error) {
        console.error("Error withdrawing funds:", error);
        return { error: "Failed to withdraw funds" };
    }
}
