import mongoose, { Schema, Model } from "mongoose";

export interface IContest {
    title: string;
    jobTitles: string[];
    skills: string[];
    description: string;
    prizeAmount: number;
    prize?: number; // Keep for backward compatibility
    closingTime?: Date;
    flags?: {
        featured: boolean;
        urgent: boolean;
    };
    status: "open" | "closed" | "completed";
    type: "contest";
    deliverables?: string[];
    deliverableFormats: string[];
    createdBy: mongoose.Types.ObjectId;
    clientId?: mongoose.Types.ObjectId;
    clientUsername?: string;
}

const ContestSchema = new Schema<IContest>(
    {
        title: { type: String, required: true },
        jobTitles: { type: [String], required: true, default: [] },
        skills: { type: [String], required: true, default: [] },
        description: { type: String, required: true },
        prizeAmount: { type: Number, required: true },
        prize: { type: Number }, // Backward compatibility
        closingTime: { type: Date },
        flags: {
            type: {
                featured: { type: Boolean, default: false },
                urgent: { type: Boolean, default: false }
            },
            default: { featured: false, urgent: false }
        },
        status: { type: String, enum: ["open", "closed", "completed"], default: "open" },
        type: { type: String, enum: ["contest"], default: "contest", required: true },
        deliverables: { type: [String], default: [] },
        deliverableFormats: { type: [String], default: [], required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        clientId: { type: Schema.Types.ObjectId, ref: "User" },
        clientUsername: { type: String },
    },
    { timestamps: true }
);

const Contest: Model<IContest> = mongoose.models.Contest || mongoose.model<IContest>("Contest", ContestSchema);

export default Contest;
