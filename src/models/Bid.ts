import mongoose, { Schema, Model } from "mongoose";

export interface IBid {
    projectId: mongoose.Types.ObjectId;
    freelancerId: mongoose.Types.ObjectId;
    amount: number;
    days: number;
    proposal: string;
    status: "pending" | "accepted" | "rejected";
    createdAt?: Date;
    updatedAt?: Date;
}

const BidSchema = new Schema<IBid>(
    {
        projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
        freelancerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
        days: { type: Number, required: true },
        proposal: { type: String, required: true },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending"
        },
    },
    { timestamps: true }
);

const Bid: Model<IBid> = mongoose.models.Bid || mongoose.model<IBid>("Bid", BidSchema);

export default Bid;
