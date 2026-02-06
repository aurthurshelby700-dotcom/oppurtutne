"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface MessageBubbleProps {
    message: {
        _id: string;
        content: string;
        sender: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        };
        createdAt: Date | string;
        isRead: boolean;
    };
    isSent: boolean;
}

export function MessageBubble({ message, isSent }: MessageBubbleProps) {
    const timestamp = format(new Date(message.createdAt), "h:mm a");

    return (
        <div
            className={cn(
                "flex mb-4",
                isSent ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2 group relative",
                    isSent
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                )}
            >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                {/* Timestamp on hover */}
                <div
                    className={cn(
                        "absolute -bottom-5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
                        isSent ? "right-0" : "left-0"
                    )}
                >
                    {timestamp}
                </div>
            </div>
        </div>
    );
}
