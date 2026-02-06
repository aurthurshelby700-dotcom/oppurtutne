"use server";

import connectToDatabase from "@/lib/db";
import FriendRequest from "@/models/FriendRequest";
import Friendship from "@/models/Friendship";
import User from "@/models/User";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function sendFriendRequest(receiverId: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    const senderId = session.user.id;

    if (senderId === receiverId) {
        return { error: "Cannot add yourself as a friend" };
    }

    try {
        await connectToDatabase();

        // Check if already friends
        const existingFriendship = await Friendship.findOne({
            users: { $all: [senderId, receiverId] },
        });

        if (existingFriendship) {
            return { error: "Already friends" };
        }

        // Check if request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }, // Check if they sent one to us
            ],
            status: "pending",
        });

        if (existingRequest) {
            return { error: "Friend request already pending" };
        }

        await FriendRequest.create({
            sender: senderId,
            receiver: receiverId,
            status: "pending",
        });

        revalidatePath(`/profile/${receiverId}`);
        revalidatePath("/profile");

        return { success: true };
    } catch (error) {
        console.error("Error sending friend request:", error);
        return { error: "Failed to send friend request" };
    }
}

export async function respondToFriendRequest(requestId: string, action: "accept" | "reject") {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return { error: "Request not found" };
        }

        if (request.receiver.toString() !== session.user.id) {
            return { error: "Unauthorized" };
        }

        if (request.status !== "pending") {
            return { error: "Request already handled" };
        }

        if (action === "accept") {
            request.status = "accepted";
            request.senderNotified = false; // Ensure sender gets notified
            await request.save();

            // Create Friendship
            await Friendship.create({
                users: [request.sender, request.receiver],
            });
        } else {
            request.status = "rejected";
            await request.save();
        }

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error("Error responding to friend request:", error);
        return { error: "Failed to respond to request" };
    }
}

export async function markRequestAsRead(requestId: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();
        await FriendRequest.findByIdAndUpdate(requestId, { senderNotified: true });
        return { success: true };
    } catch (error) {
        console.error("Error marking request as read:", error);
        return { error: "Failed to mark as read" };
    }
}

export async function getFriendshipStatus(targetUserId: string): Promise<"friends" | "sent" | "received" | "none" | { status: "received", requestId: string } | null> {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return null; // Treat as no relation
    }

    const currentUserId = session.user.id;

    try {
        await connectToDatabase();

        // 1. Check if friends
        const friendship = await Friendship.findOne({
            users: { $all: [currentUserId, targetUserId] },
        });

        if (friendship) return "friends";

        // 2. Check for pending incoming request
        const incomingRequest = await FriendRequest.findOne({
            sender: targetUserId,
            receiver: currentUserId,
            status: "pending",
        });

        if (incomingRequest) return { status: "received" as const, requestId: incomingRequest._id.toString() };

        // 3. Check for pending outgoing request
        const outgoingRequest = await FriendRequest.findOne({
            sender: currentUserId,
            receiver: targetUserId,
            status: "pending",
        });

        if (outgoingRequest) return "sent";

        return "none";
    } catch (error) {
        console.error("Error getting friend status:", error);
        return "none";
    }
}

export async function getFriends(userId?: string) {
    const session = await auth();
    const targetId = userId || session?.user?.id;

    if (!targetId) return [];

    try {
        await connectToDatabase();

        const friendships = await Friendship.find({
            users: targetId,
        }).populate({
            path: "users",
            select: "name avatarUrl profileImageUrl title",
            match: { _id: { $ne: targetId } }, // Only populate the OTHER user
        });

        // Filter out the nulls (the current user, since we used match) and map to cleaner object
        const friends = friendships.map(f => {
            const friend = f.users.find((u: any) => u._id.toString() !== targetId);
            // Ensure friend is treated as a populated user document
            if (friend && typeof friend === 'object' && 'name' in friend) {
                return {
                    id: IsPopulatedUser(friend) ? friend._id.toString() : '',
                    name: IsPopulatedUser(friend) ? friend.name : '',
                    avatarUrl: IsPopulatedUser(friend) ? friend.avatarUrl : '',
                    profileImageUrl: IsPopulatedUser(friend) ? friend.profileImageUrl : '',
                    title: IsPopulatedUser(friend) ? friend.title : ''
                };
            }
            return null;
        }).filter(Boolean);

        return friends;
    } catch (error) {
        console.error("Error fetching friends:", error);
        return [];
    }
}

// Type guard helper (can be moved if reused)
function IsPopulatedUser(user: any): user is { _id: any, name: string, avatarUrl?: string, profileImageUrl?: string, title?: string } {
    return user && typeof user.name === 'string';
}
