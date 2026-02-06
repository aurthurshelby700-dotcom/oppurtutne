import mongoose, { Schema, Model } from "mongoose";

export interface IProject {
    title: string;
    jobTitles: string[];
    skills: string[];
    description: string;
    budgetMin: number;
    budgetMax: number;
    status: "open" | "closed" | "completed";
    type: "project" | "contest";
    deliverables?: string[];
    createdBy: mongoose.Types.ObjectId;
    clientId?: mongoose.Types.ObjectId;
    clientUsername?: string;
}

const ProjectSchema = new Schema<IProject>(
    {
        title: { type: String, required: true },
        jobTitles: { type: [String], required: true, default: [] },
        skills: { type: [String], required: true, default: [] },
        description: { type: String, required: true },
        budgetMin: { type: Number, required: true },
        budgetMax: { type: Number, required: true },
        status: { type: String, enum: ["open", "closed", "completed"], default: "open" },
        type: { type: String, enum: ["project", "contest"], default: "project", required: true },
        deliverables: { type: [String], default: [] },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        clientId: { type: Schema.Types.ObjectId, ref: "User" },
        clientUsername: { type: String },
    },
    { timestamps: true }
);

const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
