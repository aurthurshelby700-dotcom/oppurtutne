import mongoose, { Schema, Model } from "mongoose";

export interface IContest {
    title: string;
    skills: string[];
    description: string;
    prize: number;
    status: "open" | "closed";
    deliverables?: string[];
    createdBy: mongoose.Types.ObjectId;
}

const ContestSchema = new Schema<IContest>(
    {
        title: { type: String, required: true },
        skills: { type: [String], default: [] },
        description: { type: String, required: true },
        prize: { type: Number, required: true },
        status: { type: String, enum: ["open", "closed"], default: "open" },
        deliverables: { type: [String], default: [] },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

const Contest: Model<IContest> = mongoose.models.Contest || mongoose.model<IContest>("Contest", ContestSchema);

export default Contest;
