
import mongoose, { Schema, Model } from "mongoose";

export interface IWallet {
    userId: mongoose.Types.ObjectId;
    username: string;
    balance: number;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        username: { type: String, required: true },
        balance: { type: Number, default: 0 },
        currency: { type: String, default: "USD" },
    },
    { timestamps: true }
);

const Wallet: Model<IWallet> = mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", WalletSchema);

export default Wallet;
