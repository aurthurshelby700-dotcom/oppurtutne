"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { Loader2 } from "lucide-react";

interface ChatBodyProps {
    messages: Array<{
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
    }>;
    currentUserId: string;
    isLoading?: boolean;
}

export function ChatBody({ messages, currentUserId, isLoading }: ChatBodyProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                    <p className="text-muted-foreground mb-2">No messages yet</p>
                    <p className="text-sm text-muted-foreground">Say hi to start the conversation!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4">
            {messages.map((message) => (
                <MessageBubble
                    key={message._id}
                    message={message}
                    isSent={message.sender.id === currentUserId}
                />
            ))}
            <div ref={bottomRef} />
        </div>
    );
}
