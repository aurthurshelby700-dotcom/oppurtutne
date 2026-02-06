
import mongoose, { Schema, Model } from "mongoose";

export interface ITransaction {
    walletId: mongoose.Types.ObjectId;
    type: "credit" | "debit";
    amount: number;
    reason: "welcome_bonus" | "project_post" | "contest_post" | "add_funds" | "withdraw";
    description: string;
    relatedId?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        walletId: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },
        type: { type: String, enum: ["credit", "debit"], required: true },
        amount: { type: Number, required: true },
        reason: {
            type: String,
            enum: ["welcome_bonus", "project_post", "contest_post", "add_funds", "withdraw"],
            required: true
        },
        description: { type: String, required: true },
        relatedId: { type: Schema.Types.ObjectId }, // projectId, contestId, etc.
    },
    { timestamps: true }
);

const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
