import mongoose, { Schema, Model } from "mongoose";

export interface IServiceRequest {
    serviceId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    freelancerId: mongoose.Types.ObjectId;
    message: string;
    status: "pending" | "accepted" | "rejected";
    createdAt?: Date;
    updatedAt?: Date;
}

const ServiceRequestSchema = new Schema<IServiceRequest>(
    {
        serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
        clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        freelancerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
    },
    { timestamps: true }
);

const ServiceRequest: Model<IServiceRequest> =
    mongoose.models.ServiceRequest || mongoose.model<IServiceRequest>("ServiceRequest", ServiceRequestSchema);

export default ServiceRequest;
