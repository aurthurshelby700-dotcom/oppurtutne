import mongoose, { Schema, Model } from "mongoose";

export interface IProject {
    title: string;
    skills: string[];
    description: string;
    budget: number;
    status: "open" | "closed";
    type: "PROJECT" | "CONTEST";
    category: string;
    deliverables?: string[];
    createdBy: mongoose.Types.ObjectId;
}

const ProjectSchema = new Schema<IProject>(
    {
        title: { type: String, required: true },
        skills: { type: [String], default: [] },
        description: { type: String, required: true },
        budget: { type: Number, required: true },
        status: { type: String, enum: ["open", "closed"], default: "open" },
        type: { type: String, enum: ["PROJECT", "CONTEST"], default: "PROJECT", required: true },
        category: { type: String, required: true },
        deliverables: { type: [String], default: [] },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
