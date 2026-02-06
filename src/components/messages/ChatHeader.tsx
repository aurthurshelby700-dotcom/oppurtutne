"use client";

import { ProfileCard } from "@/components/shared/ProfileCard";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface ChatHeaderProps {
    otherUser: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
        lastActive?: Date;
    };
}

export function ChatHeader({ otherUser }: ChatHeaderProps) {
    return (
        <div className="border-b border-border bg-card p-4 shrink-0">
            <div className="flex items-center justify-between">
                <ProfileCard
                    user={otherUser}
                    showOnlineStatus
                    className="p-0"
                />

                {/* Action buttons */}
                <Link
                    href={`/user/${otherUser.username}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                    <ExternalLink className="h-4 w-4" />
                    View Profile
                </Link>
            </div>
        </div>
    );
}
