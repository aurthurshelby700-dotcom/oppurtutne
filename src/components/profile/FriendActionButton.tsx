"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserCheck, UserX, MessageSquare, Clock } from "lucide-react";
import { sendFriendRequest, respondToFriendRequest } from "@/lib/actions/friends";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface FriendActionButtonProps {
    targetUserId: string;
    initialStatus: "friends" | "sent" | "received" | "none" | { status: "received", requestId: string };
    className?: string; // Allow custom styling
}

export default function FriendActionButton({ targetUserId, initialStatus, className }: FriendActionButtonProps) {
    const [status, setStatus] = useState(initialStatus);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleAddFriend = async () => {
        startTransition(async () => {
            const res = await sendFriendRequest(targetUserId);
            if (res.success) {
                setStatus("sent");
            } else {
                alert(res.error || "Failed to send request");
            }
        });
    };

    const handleAccept = async () => {
        if (typeof status !== "object" || status.status !== "received") return;

        startTransition(async () => {
            const res = await respondToFriendRequest(status.requestId, "accept");
            if (res.success) {
                setStatus("friends");
                router.refresh();
            } else {
                alert(res.error || "Failed to accept request");
            }
        });
    };

    const handleReject = async () => {
        if (typeof status !== "object" || status.status !== "received") return;

        startTransition(async () => {
            const res = await respondToFriendRequest(status.requestId, "reject");
            if (res.success) {
                setStatus("none");
                router.refresh();
            } else {
                alert(res.error || "Failed to reject request");
            }
        });
    };

    const handleMessage = () => {
        // Navigate to messages with this user selected
        // We'll implement the query param logic in Messages page later
        router.push(`/messages?userId=${targetUserId}`);
    };

    if (status === "friends") {
        return (
            <div className={cn("flex gap-2", className)}>
                <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg font-medium cursor-default"
                >
                    <UserCheck className="h-4 w-4" /> Friends
                </button>
                <button
                    onClick={handleMessage}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                    <MessageSquare className="h-4 w-4" /> Message
                </button>
            </div>
        );
    }

    if (status === "sent") {
        return (
            <button
                disabled
                className={cn("flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg font-medium cursor-not-allowed", className)}
            >
                <Clock className="h-4 w-4" /> Request Sent
            </button>
        );
    }

    if (typeof status === "object" && status.status === "received") {
        return (
            <div className={cn("flex gap-2", className)}>
                <button
                    onClick={handleAccept}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <UserCheck className="h-4 w-4" /> Accept
                </button>
                <button
                    onClick={handleReject}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <UserX className="h-4 w-4" /> Reject
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleAddFriend}
            disabled={isPending}
            className={cn("flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50", className)}
        >
            <UserPlus className="h-4 w-4" /> Add Friend
        </button>
    );
}
