import mongoose, { Schema, Model } from "mongoose";

export interface IEntryComment {
    entryId: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    content: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const EntryCommentSchema = new Schema<IEntryComment>(
    {
        entryId: { type: Schema.Types.ObjectId, ref: "Entry", required: true },
        authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
    },
    { timestamps: true }
);

const EntryComment: Model<IEntryComment> = mongoose.models.EntryComment || mongoose.model<IEntryComment>("EntryComment", EntryCommentSchema);

export default EntryComment;
