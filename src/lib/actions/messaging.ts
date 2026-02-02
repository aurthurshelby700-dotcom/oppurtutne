"use server";

import connectToDatabase from "@/lib/db";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

export async function sendMessage(conversationId: string | null, receiverId: string | null, content: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    const senderId = session.user.id;

    try {
        await connectToDatabase();
        let chatId = conversationId;

        // If no conversationId, check if one exists or create new
        if (!chatId && receiverId) {
            // Check for existing conversation with these exact 2 participants
            const existingConv = await Conversation.findOne({
                participants: { $all: [senderId, receiverId], $size: 2 }
            });

            if (existingConv) {
                chatId = existingConv._id.toString();
            } else {
                // Create new
                const newConv = await Conversation.create({
                    participants: [senderId, receiverId],
                    updatedAt: new Date(),
                });
                chatId = newConv._id.toString();
            }
        }

        if (!chatId) return { error: "Invalid request parameters" };

        const tempChatId = chatId; // Capture for non-null usage if needed, though chatId above handles it logic-wise

        const newMessage = await Message.create({
            conversationId: chatId,
            sender: senderId,
            content,
            readBy: [senderId],
        });

        // Update conversation last message
        await Conversation.findByIdAndUpdate(chatId, {
            lastMessage: {
                content,
                sender: senderId,
                createdAt: new Date(),
            },
            updatedAt: new Date(),
        });

        revalidatePath("/messages");
        return { success: true, message: JSON.parse(JSON.stringify(newMessage)) };
    } catch (error) {
        console.error("Error sending message:", error);
        return { error: "Failed to send message" };
    }
}

export async function getConversations() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return [];
    }

    try {
        await connectToDatabase();

        const conversations = await Conversation.find({
            participants: session.user.id,
        })
            .populate({
                path: "participants",
                select: "name avatarUrl",
                match: { _id: { $ne: session.user.id } }, // Only get OTHER participant details
            })
            .sort({ updatedAt: -1 })
            .lean();

        // Format for UI
        return conversations.map((c: any) => {
            const otherUser = c.participants.find((p: any) => p._id.toString() !== session.user.id);
            return {
                id: c._id.toString(),
                lastMessage: c.lastMessage,
                updatedAt: c.updatedAt,
                otherUser: otherUser ? {
                    id: otherUser._id.toString(),
                    name: otherUser.name,
                    avatarUrl: otherUser.avatarUrl,
                } : { name: "Unknown User" } // Fallback
            };
        });

    } catch (error) {
        console.error("Error fetching conversations:", error);
        return [];
    }
}

export async function getMessages(conversationId: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return [];
    }

    try {
        await connectToDatabase();

        // Security check: ensure user is participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: session.user.id
        });

        if (!conversation) return [];

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .lean();

        return messages.map((m: any) => ({
            id: m._id.toString(),
            content: m.content,
            senderId: m.sender.toString(),
            createdAt: m.createdAt,
            isMine: m.sender.toString() === session.user.id
        }));

    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
}
