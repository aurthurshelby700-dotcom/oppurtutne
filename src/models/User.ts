import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
    email: string;
    passwordHash: string;
    role: "freelancer" | "client" | "both" | "pending";
    name?: string;
    title?: string;
    bio?: string;
    skills?: string[];
    location?: string;
    avatarUrl?: string;
    coverUrl?: string;
    rating?: number;
    reviewsCount?: number;
    emailVerified?: boolean;
    identityVerified?: boolean;
    paymentVerified?: boolean;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ["freelancer", "client", "both", "pending"], default: "pending" },
        name: { type: String },
        title: { type: String },
        bio: { type: String },
        skills: { type: [String], default: [] },
        location: { type: String },
        avatarUrl: { type: String },
        coverUrl: { type: String },
        rating: { type: Number, default: 0 },
        reviewsCount: { type: Number, default: 0 },
        emailVerified: { type: Boolean, default: false },
        identityVerified: { type: Boolean, default: false },
        paymentVerified: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Prevent overwrite on hot reload, but allow schema updates in dev
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.User;
}
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
