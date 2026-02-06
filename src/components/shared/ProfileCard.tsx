"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
    user: {
        id?: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
        profileImageUrl?: string;
        jobTitle?: string;
        country?: string;
        lastActive?: Date | string;
    };
    showOnlineStatus?: boolean;
    compact?: boolean;
    onClick?: () => void;
    className?: string;
}

export function ProfileCard({
    user,
    showOnlineStatus = false,
    compact = false,
    onClick,
    className,
}: ProfileCardProps) {
    // Calculate if user is online (lastActive < 2 minutes)
    const isOnline = user.lastActive
        ? new Date().getTime() - new Date(user.lastActive).getTime() < 2 * 60 * 1000
        : false;

    const fullName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.username || "Unknown User";

    const imageUrl = user.profileImageUrl || user.avatarUrl;

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-3",
                onClick && "cursor-pointer hover:bg-muted/50 transition-colors",
                compact ? "p-2" : "p-4",
                className
            )}
        >
            {/* Avatar with online indicator */}
            <div className="relative shrink-0">
                <div className={cn(
                    "rounded-full overflow-hidden bg-muted flex items-center justify-center border border-border/50 shadow-sm",
                    compact ? "h-10 w-10" : "h-12 w-12"
                )}>
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={fullName}
                            width={compact ? 40 : 48}
                            height={compact ? 40 : 48}
                            unoptimized={true}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className={cn(
                            "w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-black uppercase",
                            compact ? "text-xs" : "text-sm"
                        )}>
                            {fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                    )}
                </div>

                {/* Online indicator */}
                {showOnlineStatus && (
                    <div
                        className={cn(
                            "absolute bottom-0 right-0 rounded-full border-2 border-background",
                            compact ? "h-3 w-3" : "h-3.5 w-3.5",
                            isOnline ? "bg-green-500" : "bg-gray-400"
                        )}
                        title={isOnline ? "Online" : "Offline"}
                    />
                )}
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
                <div className={cn(
                    "font-semibold truncate",
                    compact ? "text-sm" : "text-base"
                )}>
                    {fullName}
                </div>
                {!compact && user.jobTitle && (
                    <div className="text-xs text-muted-foreground truncate">
                        {user.jobTitle}
                    </div>
                )}
                {!compact && user.country && (
                    <div className="text-xs text-muted-foreground truncate">
                        {user.country}
                    </div>
                )}
            </div>
        </div>
    );
}
