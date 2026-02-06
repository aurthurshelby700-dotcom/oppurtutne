import mongoose, { Schema, Model } from "mongoose";

export interface IReview {
    targetUserId: mongoose.Types.ObjectId;
    reviewerUserId: mongoose.Types.ObjectId;
    reviewerRole: "client" | "freelancer";
    relatedType: "project" | "contest";
    relatedId: mongoose.Types.ObjectId;
    relatedTitle: string;
    rating: number; // 1-5
    reviewText: string;
    price: number;
    createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
    {
        targetUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        reviewerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        reviewerRole: { type: String, enum: ["client", "freelancer"], required: true },
        relatedType: { type: String, enum: ["project", "contest"], required: true },
        relatedId: { type: Schema.Types.ObjectId, required: true }, // Dynamic ref
        relatedTitle: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        reviewText: { type: String, required: true },
        price: { type: Number, required: true },
    },
    { timestamps: true }
);

// Ensure one review per user per related item
ReviewSchema.index({ reviewerUserId: 1, relatedId: 1, relatedType: 1 }, { unique: true });

// Prevent overwrite on hot reload
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Review;
}

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
