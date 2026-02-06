import mongoose, { Schema, Model } from "mongoose";

export interface IEntry {
    contestId: mongoose.Types.ObjectId;
    freelancerId: mongoose.Types.ObjectId;
    freelancerUsername: string;
    files: {
        fileUrl: string;
        format: string; // jpg | png | mp4 | pdf | ai | etc.
        uploadedAt: Date;
    }[];
    description?: string;
    rating?: number;
    createdAt?: Date;
    updatedAt?: Date;
    status: 'active' | 'rejected' | 'awarded';
}

const EntrySchema = new Schema<IEntry>(
    {
        contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true },
        freelancerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        freelancerUsername: { type: String, required: true },
        files: [{
            fileUrl: { type: String, required: true },
            format: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now }
        }],
        description: { type: String },
        rating: { type: Number, default: 0 },
        status: { type: String, enum: ['active', 'rejected', 'awarded'], default: 'active' },
    },
    { timestamps: true }
);

const Entry: Model<IEntry> = mongoose.models.Entry || mongoose.model<IEntry>("Entry", EntrySchema);

export default Entry;
