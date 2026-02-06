"use client";

import { useState, useEffect } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatBody } from "./ChatBody";
import { ChatInput } from "./ChatInput";
import { sendMessage as sendMessageAction, markMessagesAsRead, getConversation } from "@/lib/actions/messages";
import { MessageSquare } from "lucide-react";

interface ChatWindowProps {
    conversationId: string | null;
    currentUserId: string;
    onMessageSent?: () => void;
}

export function ChatWindow({ conversationId, currentUserId, onMessageSent }: ChatWindowProps) {
    const [conversation, setConversation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load conversation when selected
    useEffect(() => {
        if (!conversationId) {
            setConversation(null);
            return;
        }

        const loadConversation = async () => {
            setIsLoading(true);
            try {
                const result = await getConversation(conversationId);
                if (result.success && result.conversation) {
                    setConversation(result.conversation);
                    // Mark messages as read
                    await markMessagesAsRead(conversationId);
                }
            } catch (error) {
                console.error("Failed to load conversation:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadConversation();
    }, [conversationId]);

    const handleSendMessage = async (content: string) => {
        if (!conversationId) return;

        const result = await sendMessageAction(conversationId, content);
        if (result.success && result.message) {
            // Add message to local state
            setConversation((prev: any) => ({
                ...prev,
                messages: [...prev.messages, result.message],
            }));

            // Notify parent to refresh conversations list
            onMessageSent?.();
        } else {
            throw new Error(result.error || "Failed to send message");
        }
    };

    // Empty state - no conversation selected
    if (!conversationId) {
        return (
            <div className="h-full flex items-center justify-center bg-background">
                <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">Select a conversation</p>
                    <p className="text-sm text-muted-foreground">
                        Choose a conversation from the list to start messaging
                    </p>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading || !conversation) {
        return (
            <div className="h-full flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Loading conversation...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background">
            <ChatHeader otherUser={conversation.otherUser} />
            <ChatBody
                messages={conversation.messages}
                currentUserId={currentUserId}
            />
            <ChatInput onSendMessage={handleSendMessage} />
        </div>
    );
}
