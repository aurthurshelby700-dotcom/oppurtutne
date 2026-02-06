"use client";

import { ProfileCard } from "@/components/shared/ProfileCard";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ConversationItemProps {
    conversation: {
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
    };
    isSelected: boolean;
    onClick: () => void;
}

export function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
    if (!conversation.otherUser) {
        return null;
    }

    const lastMessageTime = conversation.lastMessage?.createdAt || conversation.updatedAt;
    const timeAgo = formatDistanceToNow(new Date(lastMessageTime), { addSuffix: true });

    return (
        <div
            onClick={onClick}
            className={cn(
                "border-b border-border transition-colors cursor-pointer relative",
                isSelected ? "bg-primary/10" : "hover:bg-muted/50"
            )}
        >
            <div className="flex items-center gap-3 p-3">
                {/* Profile Card */}
                <div className="flex-1 min-w-0">
                    <ProfileCard
                        user={conversation.otherUser}
                        showOnlineStatus
                        compact
                        className="p-0"
                    />

                    {/* Last message preview */}
                    {conversation.lastMessage && (
                        <div className="ml-13 mt-1">
                            <p className="text-xs text-muted-foreground truncate">
                                {conversation.lastMessage.content}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right side: time and unread badge */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo.replace("about ", "").replace(" ago", "")}
                    </span>

                    {conversation.unreadCount > 0 && (
                        <div className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                            {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
