"use server";

import connectToDatabase from "@/lib/db";
import FriendRequest from "@/models/FriendRequest";
import Message from "@/models/Message";
import Bid from "@/models/Bid";
import Project from "@/models/Project";
import Entry from "@/models/Entry";
import Contest from "@/models/Contest";
import { auth } from "@/auth";
import { unstable_noStore as noStore } from "next/cache";

export type NotificationType = "friend_request" | "message" | "friend_accepted" | "project_bid" | "contest_entry";

export interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    createdAt: Date;
    data: any; // ID of request or conversation
}

export async function getNotifications(): Promise<NotificationItem[]> {
    noStore();
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return [];
    }

    try {
        await connectToDatabase();
        const userId = session.user.id;
        const notifications: NotificationItem[] = [];

        // 1. Fetch Pending Friend Requests (where I am receiver)
        const pendingRequests = await FriendRequest.find({
            receiver: userId,
            status: "pending",
        })
            .populate("sender", "name avatarUrl profileImageUrl")
            .sort({ createdAt: -1 })
            .lean();

        pendingRequests.forEach((req: any) => {
            if (req.sender && req.sender.name) {
                notifications.push({
                    id: req._id.toString(),
                    type: "friend_request",
                    title: "Friend Request",
                    description: `${req.sender.name} sent you a friend request`,
                    createdAt: req.createdAt,
                    data: {
                        requestId: req._id.toString(),
                        senderId: req.sender._id.toString(),
                        senderName: req.sender.name,
                        senderAvatar: req.sender.profileImageUrl || req.sender.avatarUrl
                    }
                });
            }
        });

        // 2. Fetch Accepted Friend Requests (where I am sender and NOT notified)
        const acceptedRequests = await FriendRequest.find({
            sender: userId,
            status: "accepted",
            senderNotified: false,
        })
            .populate("receiver", "name avatarUrl profileImageUrl")
            .sort({ createdAt: -1 })
            .lean();

        acceptedRequests.forEach((req: any) => {
            if (req.receiver && req.receiver.name) {
                notifications.push({
                    id: req._id.toString(),
                    type: "friend_accepted",
                    title: "Friend Request Accepted",
                    description: `${req.receiver.name} accepted your friend request`,
                    createdAt: req.updatedAt || req.createdAt,
                    data: {
                        requestId: req._id.toString(),
                        friendId: req.receiver._id.toString(),
                        friendName: req.receiver.name,
                        friendAvatar: req.receiver.profileImageUrl || req.receiver.avatarUrl
                    }
                });
            }
        });

        // 3. Fetch Unread Messages
        const unreadMessages = await Message.find({
            sender: { $ne: userId },
            readBy: { $ne: userId }
        })
            .populate("sender", "name")
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        const handledConvs = new Set();

        unreadMessages.forEach((msg: any) => {
            const convId = msg.conversationId.toString();
            if (!handledConvs.has(convId)) {
                handledConvs.add(convId);
                if (msg.sender && msg.sender.name) {
                    notifications.push({
                        id: msg._id.toString(),
                        type: "message",
                        title: "New Message",
                        description: `You have a new message from ${msg.sender.name}`,
                        createdAt: msg.createdAt,
                        data: {
                            conversationId: convId,
                            senderId: msg.sender._id.toString()
                        }
                    });
                }
            }
        });

        // 4. Fetch Project Bids (for projects created by me)
        // Find my projects first
        const myProjects = await Project.find({ createdBy: userId }).select('_id title').lean();
        const myProjectIds = myProjects.map((p: any) => p._id);

        if (myProjectIds.length > 0) {
            const recentBids = await Bid.find({
                projectId: { $in: myProjectIds },
                status: 'pending' // Only show pending bids as "notifications"
            })
                .populate('freelancerId', 'name')
                .populate('projectId', 'title') // Populate mostly for safety, though we have title in myProjects
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            recentBids.forEach((bid: any) => {
                if (bid.freelancerId && bid.freelancerId.name && bid.projectId) {
                    notifications.push({
                        id: bid._id.toString(),
                        type: "project_bid",
                        title: "New Proposal",
                        description: `${bid.freelancerId.name} placed a bid on "${bid.projectId.title}"`,
                        createdAt: bid.createdAt,
                        data: {
                            bidId: bid._id.toString(),
                            projectId: bid.projectId._id.toString(),
                            projectTitle: bid.projectId.title,
                            freelancerName: bid.freelancerId.name
                        }
                    });
                }
            });
        }

        // 5. Fetch Contest Entries (for contests created by me)
        const myContests = await Contest.find({ createdBy: userId }).select('_id title').lean();
        const myContestIds = myContests.map((c: any) => c._id);

        if (myContestIds.length > 0) {
            const recentEntries = await Entry.find({
                contestId: { $in: myContestIds }
                // Entries assume "open" aka just submitted. They don't have a status field in the schema provided earlier,
                // so we just fetch recent ones.
            })
                .populate('freelancerId', 'name')
                .populate('contestId', 'title')
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            recentEntries.forEach((entry: any) => {
                if (entry.freelancerId && entry.freelancerId.name && entry.contestId) {
                    notifications.push({
                        id: entry._id.toString(),
                        type: "contest_entry",
                        title: "New Entry",
                        description: `${entry.freelancerId.name} submitted an entry to "${entry.contestId.title}"`,
                        createdAt: entry.createdAt,
                        data: {
                            entryId: entry._id.toString(),
                            contestId: entry.contestId._id.toString(),
                            contestTitle: entry.contestId.title,
                            freelancerName: entry.freelancerId.name
                        }
                    });
                }
            });
        }

        // Sort combined list by date desc
        return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
}

// Create a notification in the database
export async function createNotification(data: {
    receiverUsername: string;
    type: string;
    message: string;
    relatedId?: string;
    relatedType?: string;
}) {
    try {
        await connectToDatabase();
        const Notification = (await import("@/models/Notification")).default;
        const User = (await import("@/models/User")).default;

        // Get receiver user ID from username
        const receiver = await User.findOne({ username: data.receiverUsername });
        if (!receiver) {
            console.error(`User not found: ${data.receiverUsername}`);
            return { error: "User not found" };
        }

        await Notification.create({
            receiverId: receiver._id,
            receiverUsername: data.receiverUsername,
            type: data.type as any, // Type will be validated by schema
            message: data.message,
            relatedId: data.relatedId,
            relatedType: data.relatedType as any,
            isRead: false
        });

        return { success: true };
    } catch (error) {
        console.error("Error creating notification:", error);
        return { error: "Failed to create notification" };
    }
}
