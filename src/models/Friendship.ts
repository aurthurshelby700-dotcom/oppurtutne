import mongoose, { Schema, Model } from "mongoose";

export interface IFriendship {
    users: mongoose.Types.ObjectId[];
    createdAt: Date;
}

const FriendshipSchema = new Schema<IFriendship>(
    {
        users: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    },
    { timestamps: true }
);

// Ensure unique friendship between two users
FriendshipSchema.index({ users: 1 }, { unique: true });

if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Friendship;
}

const Friendship: Model<IFriendship> = mongoose.models.Friendship || mongoose.model<IFriendship>("Friendship", FriendshipSchema);

export default Friendship;
