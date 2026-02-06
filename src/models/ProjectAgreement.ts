import mongoose, { Schema, Model } from "mongoose";

export interface IProjectAgreement {
    projectId: mongoose.Types.ObjectId;
    bidId: mongoose.Types.ObjectId;
    clientUsername: string;
    freelancerUsername: string;
    clientSigned: boolean;
    freelancerSigned: boolean;
    signedAtClient?: Date;
    signedAtFreelancer?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectAgreementSchema = new Schema<IProjectAgreement>(
    {
        projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
        bidId: { type: Schema.Types.ObjectId, ref: "Bid", required: true },
        clientUsername: { type: String, required: true },
        freelancerUsername: { type: String, required: true },
        clientSigned: { type: Boolean, default: false },
        freelancerSigned: { type: Boolean, default: false },
        signedAtClient: { type: Date },
        signedAtFreelancer: { type: Date },
    },
    { timestamps: true }
);

const ProjectAgreement: Model<IProjectAgreement> =
    mongoose.models.ProjectAgreement || mongoose.model<IProjectAgreement>("ProjectAgreement", ProjectAgreementSchema);

export default ProjectAgreement;
