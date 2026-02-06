"use server";

import connectToDatabase from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Friendship from "@/models/Friendship";
import User from "@/models/User";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

/**
 * Get all conversations for the current user with unread counts
 */
export async function getConversations() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        const userId = new mongoose.Types.ObjectId(session.user.id);

        // Get all conversations where user is a participant
        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate("participants", "username firstName lastName avatarUrl profileImageUrl lastActive")
            .sort({ updatedAt: -1 })
            .lean();

        // For each conversation, get unread message count
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await Message.countDocuments({
                    conversationId: conv._id,
                    sender: { $ne: userId },
                    readBy: { $nin: [userId] },
                });

                // Get the other participant
                const otherUser = (conv.participants as any[]).find(
                    (p: any) => p._id.toString() !== session.user.id
                );

                return {
                    _id: conv._id.toString(),
                    otherUser: otherUser ? {
                        id: otherUser._id.toString(),
                        username: otherUser.username,
                        firstName: otherUser.firstName,
                        lastName: otherUser.lastName,
                        avatarUrl: otherUser.avatarUrl,
                        profileImageUrl: otherUser.profileImageUrl,
                        lastActive: otherUser.lastActive ? otherUser.lastActive.toISOString() : null,
                    } : null,
                    lastMessage: conv.lastMessage ? {
                        content: conv.lastMessage.content,
                        sender: conv.lastMessage.sender,
                        createdAt: conv.lastMessage.createdAt.toISOString(),
                    } : undefined,
                    updatedAt: conv.updatedAt.toISOString(),
                    unreadCount,
                };
            })
        );

        return { success: true, conversations: conversationsWithUnread };
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return { error: "Failed to fetch conversations" };
    }
}

/**
 * Get a single conversation with all messages
 */
export async function getConversation(conversationId: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        const userId = new mongoose.Types.ObjectId(session.user.id);
        const convId = new mongoose.Types.ObjectId(conversationId);

        // Verify user is a participant
        const conversation = await Conversation.findOne({
            _id: convId,
            participants: userId,
        }).populate("participants", "username firstName lastName avatarUrl profileImageUrl lastActive");

        if (!conversation) {
            return { error: "Conversation not found" };
        }

        // Get all messages
        const messages = await Message.find({ conversationId: convId })
            .populate("sender", "username firstName lastName avatarUrl profileImageUrl")
            .sort({ createdAt: 1 })
            .lean();

        // Get the other participant
        const otherUser = (conversation.participants as any[]).find(
            (p: any) => p._id.toString() !== session.user.id
        );

        return {
            success: true,
            conversation: {
                _id: conversation._id.toString(),
                otherUser: otherUser ? {
                    id: otherUser._id.toString(),
                    username: otherUser.username,
                    firstName: otherUser.firstName,
                    lastName: otherUser.lastName,
                    avatarUrl: otherUser.avatarUrl,
                    profileImageUrl: otherUser.profileImageUrl,
                    lastActive: otherUser.lastActive ? otherUser.lastActive.toISOString() : null,
                } : null,
                messages: messages.map((m) => ({
                    _id: m._id.toString(),
                    content: m.content,
                    sender: {
                        id: (m.sender as any)._id.toString(),
                        username: (m.sender as any).username,
                        firstName: (m.sender as any).firstName,
                        lastName: (m.sender as any).lastName,
                        avatarUrl: (m.sender as any).avatarUrl,
                        profileImageUrl: (m.sender as any).profileImageUrl,
                    },
                    createdAt: m.createdAt.toISOString(),
                    isRead: m.readBy.some((id) => id.toString() === session.user.id),
                })),
            },
        };
    } catch (error) {
        console.error("Error fetching conversation:", error);
        return { error: "Failed to fetch conversation" };
    }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(conversationId: string, content: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    if (!content || content.trim().length === 0) {
        return { error: "Message cannot be empty" };
    }

    try {
        await connectToDatabase();

        const userId = new mongoose.Types.ObjectId(session.user.id);
        const convId = new mongoose.Types.ObjectId(conversationId);

        // Verify user is a participant
        const conversation = await Conversation.findOne({
            _id: convId,
            participants: userId,
        });

        if (!conversation) {
            return { error: "Conversation not found" };
        }

        // Create message
        const message = await Message.create({
            conversationId: convId,
            sender: userId,
            content: content.trim(),
            readBy: [userId], // Sender has read their own message
        });

        // Update conversation's lastMessage
        conversation.lastMessage = {
            content: content.trim(),
            sender: userId,
            createdAt: new Date(),
        };
        await conversation.save();

        // Populate sender info
        await message.populate("sender", "username firstName lastName avatarUrl profileImageUrl");

        revalidatePath("/messages");

        return {
            success: true,
            message: {
                _id: message._id.toString(),
                content: message.content,
                sender: {
                    id: (message.sender as any)._id.toString(),
                    username: (message.sender as any).username,
                    firstName: (message.sender as any).firstName,
                    lastName: (message.sender as any).lastName,
                    avatarUrl: (message.sender as any).avatarUrl,
                    profileImageUrl: (message.sender as any).profileImageUrl,
                },
                createdAt: message.createdAt.toISOString(),
                isRead: true,
            },
        };
    } catch (error) {
        console.error("Error sending message:", error);
        return { error: "Failed to send message" };
    }
}

/**
 * Mark all messages in a conversation as read
 */
export async function markMessagesAsRead(conversationId: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        const userId = new mongoose.Types.ObjectId(session.user.id);
        const convId = new mongoose.Types.ObjectId(conversationId);

        // Update all unread messages
        await Message.updateMany(
            {
                conversationId: convId,
                sender: { $ne: userId },
                readBy: { $nin: [userId] },
            },
            {
                $addToSet: { readBy: userId },
            }
        );

        revalidatePath("/messages");

        return { success: true };
    } catch (error) {
        console.error("Error marking messages as read:", error);
        return { error: "Failed to mark messages as read" };
    }
}

/**
 * Check if current user can message another user
 * Users can message if they are friends
 */
export async function canMessage(targetUserId: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return false;
    }

    try {
        await connectToDatabase();

        const userId = session.user.id;

        // Check if they are friends
        const friendship = await Friendship.findOne({
            users: { $all: [userId, targetUserId] },
        });

        return !!friendship;
    } catch (error) {
        console.error("Error checking message permission:", error);
        return false;
    }
}

/**
 * Get or create a conversation between two users
 */
export async function getOrCreateConversation(otherUserId: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        const userId = new mongoose.Types.ObjectId(session.user.id);
        const otherId = new mongoose.Types.ObjectId(otherUserId);

        // Check if conversation exists
        let conversation = await Conversation.findOne({
            participants: { $all: [userId, otherId] },
        });

        // If not, create it (only if they are friends)
        if (!conversation) {
            const canMsg = await canMessage(otherUserId);
            if (!canMsg) {
                return { error: "Cannot message this user" };
            }

            conversation = await Conversation.create({
                participants: [userId, otherId],
            });
        }

        return { success: true, conversationId: conversation._id.toString() };
    } catch (error) {
        console.error("Error getting/creating conversation:", error);
        return { error: "Failed to get conversation" };
    }
}

/**
 * Update user's lastActive timestamp
 */
export async function updateLastActive() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        await User.findByIdAndUpdate(session.user.id, {
            lastActive: new Date(),
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating lastActive:", error);
        return { error: "Failed to update status" };
    }
}
