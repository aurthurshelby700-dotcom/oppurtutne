"use client";

import { UserCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    user: {
        username: string;
        profileImageUrl?: string;
        avatarUrl?: string;
        firstName?: string;
    };
    className?: string;
    size?: number;
}

export default function UserAvatar({ user, className, size = 40 }: UserAvatarProps) {
    const imageUrl = user.profileImageUrl || user.avatarUrl;
    const initials = user.firstName ? user.firstName[0].toUpperCase() : user.username[0].toUpperCase();

    return (
        <div className={cn("relative rounded-full overflow-hidden bg-muted border border-border flex-shrink-0", className)} style={{ width: size, height: size }}>
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={user.username}
                    width={size}
                    height={size}
                    unoptimized
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold" style={{ fontSize: size * 0.4 }}>
                    {initials}
                </div>
            )}
        </div>
    );
}
