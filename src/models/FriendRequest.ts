import mongoose, { Schema, Model } from "mongoose";

export interface IFriendRequest {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    status: "pending" | "accepted" | "rejected";
    senderNotified: boolean;
    createdAt: Date;
}

const FriendRequestSchema = new Schema<IFriendRequest>(
    {
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
        senderNotified: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Prevent duplicate pending requests
FriendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

if (process.env.NODE_ENV === "development") {
    delete mongoose.models.FriendRequest;
}

const FriendRequest: Model<IFriendRequest> = mongoose.models.FriendRequest || mongoose.model<IFriendRequest>("FriendRequest", FriendRequestSchema);

export default FriendRequest;
