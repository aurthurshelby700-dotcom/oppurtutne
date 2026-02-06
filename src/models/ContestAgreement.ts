
import mongoose, { Schema, Model } from "mongoose";

export interface IContestAgreement {
    contestId: mongoose.Types.ObjectId;
    entryId: mongoose.Types.ObjectId;
    clientUsername: string;
    freelancerUsername: string;
    clientSigned: boolean;
    freelancerSigned: boolean;
    signedAtClient?: Date;
    signedAtFreelancer?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ContestAgreementSchema = new Schema<IContestAgreement>(
    {
        contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true },
        entryId: { type: Schema.Types.ObjectId, ref: "Entry", required: true },
        clientUsername: { type: String, required: true },
        freelancerUsername: { type: String, required: true },
        clientSigned: { type: Boolean, default: false },
        freelancerSigned: { type: Boolean, default: false },
        signedAtClient: { type: Date },
        signedAtFreelancer: { type: Date },
    },
    { timestamps: true }
);

const ContestAgreement: Model<IContestAgreement> =
    mongoose.models.ContestAgreement || mongoose.model<IContestAgreement>("ContestAgreement", ContestAgreementSchema);

export default ContestAgreement;
