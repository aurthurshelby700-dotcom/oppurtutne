"use client";

import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    onSendMessage: (content: string) => Promise<void>;
    disabled?: boolean;
    permissionMessage?: string;
}

export function ChatInput({ onSendMessage, disabled, permissionMessage }: ChatInputProps) {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!message.trim() || isSending || disabled) return;

        setIsSending(true);
        try {
            await onSendMessage(message.trim());
            setMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-border bg-card p-4 shrink-0">
            {disabled && permissionMessage ? (
                <div className="text-center text-sm text-muted-foreground py-3">
                    {permissionMessage}
                </div>
            ) : (
                <div className="flex items-end gap-2">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        disabled={isSending || disabled}
                        rows={1}
                        className="flex-1 resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50 max-h-32"
                        style={{
                            minHeight: "44px",
                            height: "auto",
                        }}
                    />

                    <button
                        onClick={handleSend}
                        disabled={!message.trim() || isSending || disabled}
                        className={cn(
                            "shrink-0 h-11 w-11 rounded-lg flex items-center justify-center transition-colors",
                            message.trim() && !isSending && !disabled
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
