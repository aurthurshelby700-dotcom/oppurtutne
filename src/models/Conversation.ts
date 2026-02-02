import mongoose, { Schema, Model } from "mongoose";

export interface IConversation {
    participants: mongoose.Types.ObjectId[];
    lastMessage?: {
        content: string;
        sender: mongoose.Types.ObjectId;
        createdAt: Date;
    };
    updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
    {
        participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
        lastMessage: {
            content: { type: String },
            sender: { type: Schema.Types.ObjectId, ref: "User" },
            createdAt: { type: Date },
        },
    },
    { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Conversation;
}

const Conversation: Model<IConversation> = mongoose.models.Conversation || mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
