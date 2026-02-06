import mongoose, { Schema, Model } from "mongoose";

export interface INotification {
    receiverId: mongoose.Types.ObjectId;
    receiverUsername: string;
    type:
    | "friend_request_received"
    | "friend_request_accepted"
    | "new_message"
    | "project_bid_received"
    | "project_bid_accepted"
    | "project_bid_rejected"
    | "contest_entry_received"
    | "contest_entry_awarded"
    | "contest_entry_rejected"
    | "contest_handover_submitted"
    | "contest_handover_accepted"
    | "contest_handover_disputed"
    | "project_agreement_signed"
    | "project_handover_submitted"
    | "project_handover_accepted"
    | "project_handover_disputed"
    | "service_request_received"
    | "service_request_accepted"
    | "comment_on_contest_entry"
    | "entry_liked"
    | "profile_view"
    | "rating_available"
    | "review_received";
    message: string;
    relatedId?: mongoose.Types.ObjectId;
    relatedType?: "project" | "contest" | "entry" | "message" | "service" | "profile" | "user"; // Added 'user' for friend requests
    isRead: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        receiverUsername: { type: String, required: true },
        type: {
            type: String,
            enum: [
                "friend_request_received",
                "friend_request_accepted",
                "new_message",
                "project_bid_received",
                "project_bid_accepted",
                "project_bid_rejected",
                "contest_entry_received",
                "contest_entry_awarded",
                "contest_entry_rejected",
                "contest_handover_submitted",
                "contest_handover_accepted",
                "contest_handover_disputed",
                "project_agreement_signed",
                "project_handover_submitted",
                "project_handover_accepted",
                "project_handover_disputed",
                "service_request_received",
                "service_request_accepted",
                "comment_on_contest_entry",
                "entry_liked",
                "profile_view",
                "rating_available",
                "review_received"
            ],
            required: true
        },
        message: { type: String, required: true },
        relatedId: { type: Schema.Types.ObjectId },
        relatedType: {
            type: String,
            enum: ["project", "contest", "entry", "message", "service", "profile", "user"]
        },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
