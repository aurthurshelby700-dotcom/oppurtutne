import mongoose, { Schema, Model } from "mongoose";

export interface IService {
    title: string;
    description: string;
    jobTitles: string[];
    skills: string[];
    pricingType: "hourly" | "fixed";
    price: number;
    deliveryTime?: string;
    status: "draft" | "active" | "paused";
    createdBy: mongoose.Types.ObjectId;
}

const ServiceSchema = new Schema<IService>(
    {
        title: { type: String, required: true, maxlength: 100 },
        jobTitles: { type: [String], required: true, default: [] },
        description: { type: String, required: true, minlength: 50 },
        skills: { type: [String], required: true, default: [] },
        pricingType: { type: String, enum: ["hourly", "fixed"], required: true },
        price: { type: Number, required: true },
        deliveryTime: { type: String }, // e.g. "3 days"
        status: { type: String, enum: ["draft", "active", "paused"], default: "draft" },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

const Service: Model<IService> = mongoose.models.Service || mongoose.model<IService>("Service", ServiceSchema);

export default Service;
