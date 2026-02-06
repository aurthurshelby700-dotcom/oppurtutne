import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    role: "freelancer" | "client" | "both" | "pending";
    jobTitles: string[];
    bio?: string;
    pricePerHour?: number;
    skills: string[];
    country?: string;
    mobileNumber?: string;
    profileCompleted?: boolean;
    location?: string;
    avatarUrl?: string;
    coverUrl?: string;
    profileImageUrl?: string | null;
    bannerImageUrl?: string | null;
    rating?: number;
    reviewsCount?: number;
    emailVerified?: boolean;
    verificationToken?: string;
    identityVerified?: boolean;
    paymentVerified?: boolean;
    portfolio?: {
        _id?: string;
        title: string;
        description?: string;
        imageUrl: string;
        link?: string;
    }[];
    verification?: {
        email: boolean;
        mobile: boolean;
        identity: boolean;
        payment: boolean;
    };
    lastActive?: Date;
    createdAt: Date;
    // Computed property for backward compatibility
    readonly name: string;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true },
        username: { type: String, required: true, unique: true, lowercase: true, trim: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ["freelancer", "client", "both", "pending"], default: "both" },
        jobTitles: { type: [String], default: [] },
        bio: { type: String },
        pricePerHour: { type: Number, default: 0 },
        skills: { type: [String], default: [] },
        country: { type: String },
        mobileNumber: { type: String },
        profileCompleted: { type: Boolean, default: false },
        location: { type: String },
        avatarUrl: { type: String },
        coverUrl: { type: String },
        profileImageUrl: { type: String, default: null },
        bannerImageUrl: { type: String, default: null },
        rating: { type: Number, default: 0 },
        reviewsCount: { type: Number, default: 0 },
        emailVerified: { type: Boolean, default: false },
        verificationToken: { type: String, select: false },
        identityVerified: { type: Boolean, default: false },
        paymentVerified: { type: Boolean, default: false },
        portfolio: [{
            title: { type: String, required: true },
            description: { type: String },
            imageUrl: { type: String, required: true },
            link: { type: String },
            _id: { type: Schema.Types.ObjectId, auto: true } // Ensure ID is generated
        }],
        verification: {
            email: { type: Boolean, default: false },
            mobile: { type: Boolean, default: false },
            identity: { type: Boolean, default: false },
            payment: { type: Boolean, default: false }
        },
        lastActive: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual for name
UserSchema.virtual('name').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Prevent overwrite on hot reload, but allow schema updates in dev
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.User;
}
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
