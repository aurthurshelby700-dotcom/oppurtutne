"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { ConversationItem } from "./ConversationItem";

interface Conversation {
    _id: string;
    otherUser: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
        lastActive?: Date;
    } | null;
    lastMessage?: {
        content: string;
        sender: any;
        createdAt: Date;
    };
    updatedAt: Date;
    unreadCount: number;
}

interface ConversationsListProps {
    conversations: Conversation[];
    selectedConversationId?: string;
    onSelectConversation: (conversationId: string) => void;
}

export function ConversationsList({
    conversations,
    selectedConversationId,
    onSelectConversation,
}: ConversationsListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredConversations, setFilteredConversations] = useState(conversations);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredConversations(conversations);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredConversations(
                conversations.filter((conv) => {
                    const username = conv.otherUser?.username?.toLowerCase() || "";
                    const firstName = conv.otherUser?.firstName?.toLowerCase() || "";
                    const lastName = conv.otherUser?.lastName?.toLowerCase() || "";
                    return (
                        username.includes(query) ||
                        firstName.includes(query) ||
                        lastName.includes(query)
                    );
                })
            );
        }
    }, [searchQuery, conversations]);

    return (
        <div className="h-full flex flex-col border-r border-border bg-card">
            {/* Header */}
            <div className="p-4 border-b border-border shrink-0">
                <h1 className="text-2xl font-bold mb-4">Messages</h1>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        {searchQuery ? (
                            <p>No conversations found</p>
                        ) : (
                            <div>
                                <p className="mb-2">No conversations yet</p>
                                <p className="text-sm">Add friends to start messaging!</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {filteredConversations.map((conversation) => (
                            <ConversationItem
                                key={conversation._id}
                                conversation={conversation}
                                isSelected={selectedConversationId === conversation._id}
                                onClick={() => onSelectConversation(conversation._id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
