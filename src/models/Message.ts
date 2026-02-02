import mongoose, { Schema, Model } from "mongoose";

export interface IMessage {
    conversationId: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    content: string;
    readBy: mongoose.Types.ObjectId[];
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Message;
}

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
