
import Notification, { INotification } from "@/models/Notification";
import User from "@/models/User";
import connectToDatabase from "@/lib/db";
import mongoose from "mongoose";

export async function createNotification(
    data: Omit<INotification, "receiverId" | "isRead" | "createdAt"> & { receiverId?: string | mongoose.Types.ObjectId }
) {
    try {
        await connectToDatabase();

        let receiverId = data.receiverId;

        // If receiverId is not provided, try to find it by username
        if (!receiverId) {
            const user = await User.findOne({ username: data.receiverUsername });
            if (!user) {
                console.error(`User with username ${data.receiverUsername} not found.`);
                return null;
            }
            receiverId = user._id;
        }

        const notification = await Notification.create({
            receiverId,
            receiverUsername: data.receiverUsername,
            type: data.type,
            message: data.message,
            relatedId: data.relatedId,
            relatedType: data.relatedType,
            isRead: false,
        });

        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        return null; // Don't crash the request if notification fails
    }
}
