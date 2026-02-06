"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { ConversationsList } from "@/components/messages/ConversationsList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { getConversations, updateLastActive } from "@/lib/actions/messages";

export default function MessagesPage() {
    const { data: session, status } = useSession();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Redirect if not authenticated
    if (status === "unauthenticated") {
        redirect("/login");
    }

    // Load conversations
    const loadConversations = async () => {
        const result = await getConversations();
        if (result.success && result.conversations) {
            setConversations(result.conversations);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (status === "authenticated") {
            loadConversations();
        }
    }, [status]);

    // Update lastActive on mount and periodically
    useEffect(() => {
        if (status === "authenticated") {
            updateLastActive();

            const interval = setInterval(() => {
                updateLastActive();
            }, 30000); // Every 30 seconds

            return () => clearInterval(interval);
        }
    }, [status]);

    // Auto-refresh conversations every 10 seconds
    useEffect(() => {
        if (status === "authenticated") {
            const interval = setInterval(() => {
                loadConversations();
            }, 10000);

            return () => clearInterval(interval);
        }
    }, [status]);

    if (status === "loading" || isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Loading messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex">
            {/* Left Panel - Conversations List (30%) */}
            <div className="w-[30%] min-w-[300px] max-w-[400px]">
                <ConversationsList
                    conversations={conversations}
                    selectedConversationId={selectedConversationId || undefined}
                    onSelectConversation={setSelectedConversationId}
                />
            </div>

            {/* Right Panel - Chat Window (70%) */}
            <div className="flex-1">
                <ChatWindow
                    conversationId={selectedConversationId}
                    currentUserId={session?.user?.id || ""}
                    onMessageSent={loadConversations}
                />
            </div>
        </div>
    );
}
