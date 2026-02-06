
import mongoose, { Schema, Model } from "mongoose";

export interface IContestHandover {
    contestId: mongoose.Types.ObjectId;
    entryId: mongoose.Types.ObjectId;
    freelancerUsername: string;
    files: Array<{
        fileUrl: string;
        format: string;
        uploadedAt: Date;
    }>;
    status: "draft" | "submitted" | "accepted" | "disputed";
    uploadedAt?: Date;
    acceptedAt?: Date;
    clientHasRated: boolean;
    freelancerHasRated: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ContestHandoverSchema = new Schema<IContestHandover>(
    {
        contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true },
        entryId: { type: Schema.Types.ObjectId, ref: "Entry", required: true },
        freelancerUsername: { type: String, required: true },
        files: [{
            fileUrl: { type: String, required: true },
            format: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now }
        }],
        status: { type: String, enum: ["draft", "submitted", "accepted", "disputed"], default: "draft" },
        uploadedAt: { type: Date },
        acceptedAt: { type: Date },
        clientHasRated: { type: Boolean, default: false },
        freelancerHasRated: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const ContestHandover: Model<IContestHandover> =
    mongoose.models.ContestHandover || mongoose.model<IContestHandover>("ContestHandover", ContestHandoverSchema);

export default ContestHandover;
