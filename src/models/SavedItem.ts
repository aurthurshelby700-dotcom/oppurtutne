import mongoose, { Schema, Model } from "mongoose";

export interface ISavedItem {
    user: mongoose.Types.ObjectId;
    item: mongoose.Types.ObjectId;
    itemType: "project" | "contest" | "service" | "freelancer" | "course";
    createdAt: Date;
}

const SavedItemSchema = new Schema<ISavedItem>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        item: { type: Schema.Types.ObjectId, required: true, refPath: "modelName" }, // Dynamic ref path helper? Or just generic ObjectId.
        // Actually, dynamic ref is tricky without a field to store the model name.
        // Let's store `itemType` and use manual virtuals or just separate queries if needed.
        // Or simpler: We don't populate strictly by Ref for mixed lists often.
        // But for `getSavedItems(type)`, we can populate based on type.
        itemType: {
            type: String,
            enum: ["project", "contest", "service", "freelancer", "course"],
            required: true
        },
    },
    { timestamps: true }
);

// Compound index to prevent duplicate saves
SavedItemSchema.index({ user: 1, item: 1, itemType: 1 }, { unique: true });

if (process.env.NODE_ENV === "development") {
    delete mongoose.models.SavedItem;
}

const SavedItem: Model<ISavedItem> = mongoose.models.SavedItem || mongoose.model<ISavedItem>("SavedItem", SavedItemSchema);

export default SavedItem;
