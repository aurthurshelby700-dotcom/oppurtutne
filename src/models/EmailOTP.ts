import mongoose, { Schema, Model } from "mongoose";

export interface IEmailOTP {
    userId: mongoose.Types.ObjectId;
    otpHash: string;
    expiresAt: Date;
    createdAt: Date;
}

const EmailOTPSchema = new Schema<IEmailOTP>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        otpHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

// Create index for automatic deletion of expired OTPs
EmailOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailOTP: Model<IEmailOTP> =
    mongoose.models.EmailOTP || mongoose.model<IEmailOTP>("EmailOTP", EmailOTPSchema);

export default EmailOTP;
