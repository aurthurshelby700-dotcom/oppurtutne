"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getConversations, getMessages, sendMessage } from "@/lib/actions/messaging";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { Send, UserCircle, Search, Loader2, MessageSquare } from "lucide-react";

type IConversation = {
    id: string;
    lastMessage?: { content: string; createdAt: Date };
    updatedAt: Date;
    otherUser: { id?: string; name: string; avatarUrl?: string };
};

type Message = {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
    isMine: boolean;
};

function MessagesContent() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const router = useRouter();

    // State
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [activeReceiverId, setActiveReceiverId] = useState<string | null>(searchParams.get("userId"));
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoadingConvs, setIsLoadingConvs] = useState(true);
    const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        loadConversations();
    }, []);

    // Polling for messages
    useEffect(() => {
        if (!activeConvId) return;

        const interval = setInterval(() => {
            loadMessages(activeConvId, true); // Silent update
        }, 3000);

        return () => clearInterval(interval);
    }, [activeConvId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadConversations = async () => {
        setIsLoadingConvs(true);
        const data = await getConversations();
        setConversations(data);
        setIsLoadingConvs(false);

        // Handle initial selection from query param or existing list
        if (activeReceiverId) {
            const existing = data.find(c => c.otherUser.id === activeReceiverId);
            if (existing) {
                setActiveConvId(existing.id);
                loadMessages(existing.id);
            } else {
                // New fake conversation state (will be created on first message)
                setActiveConvId(null);
                setMessages([]);
            }
        } else if (data.length > 0 && !activeConvId) {
            // Optional: Auto-select first? Maybe not.
        }
    };

    const loadMessages = async (convId: string, silent = false) => {
        if (!silent) setIsLoadingMsgs(true);
        const data = await getMessages(convId);
        setMessages(data); // In real app, merge/dedupe
        if (!silent) setIsLoadingMsgs(false);
    };

    const handleSelectConversation = (conv: IConversation) => {
        setActiveConvId(conv.id);
        setActiveReceiverId(conv.otherUser.id || null);
        loadMessages(conv.id);

        // update url without reload
        if (conv.otherUser.id) {
            const params = new URLSearchParams(searchParams.toString());
            params.set("userId", conv.otherUser.id);
            window.history.replaceState(null, "", `?${params.toString()}`);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;
        if (!activeConvId && !activeReceiverId) return;

        const content = inputText;
        setInputText("");
        setIsSending(true);

        // Optimistic UI update (optional, but good for UX)
        // const tempId = Date.now().toString();
        // setMessages(prev => [...prev, { id: tempId, content, senderId: user?.id || "", createdAt: new Date(), isMine: true }]);

        const res = await sendMessage(activeConvId, activeReceiverId, content);

        if (res.success) {
            // refresh everything
            if (!activeConvId) {
                // We just created a new conversation
                loadConversations();
                // The response message has the conversationId if we returned it properly, 
                // but simpler to just reload convs and find it, or wait for poll
                // Ideally sendMessage returns the new conversation ID
            }
            // Reload messages to get the real DB one
            if (activeConvId) loadMessages(activeConvId, true);
            else {
                // Should ideally switch to the new ID
                setTimeout(loadConversations, 500);
            }
        } else {
            alert("Failed to send");
        }
        setIsSending(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const activeUser = conversations.find(c => c.id === activeConvId)?.otherUser
        || (activeReceiverId ? { name: "New Chat", id: activeReceiverId } : null);

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-card rounded-xl border border-border overflow-hidden">
            {/* Sidebar List */}
            <div className="w-80 border-r border-border flex flex-col hidden md:flex">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold">Messages</h2>
                    <div className="relative mt-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-8 px-3 py-2 bg-muted rounded-md text-sm outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoadingConvs ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
                    ) : conversations.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground p-4">No conversations yet.</p>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => handleSelectConversation(conv)}
                                className={cn(
                                    "p-3 rounded-lg cursor-pointer flex gap-3 transition-colors",
                                    activeConvId === conv.id ? "bg-primary/10" : "hover:bg-muted"
                                )}
                            >
                                <div className="h-10 w-10 shrink-0 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                                    {conv.otherUser.avatarUrl ? (
                                        <img src={conv.otherUser.avatarUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <UserCircle className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <div className="flex justify-between items-baseline">
                                        <h4 className={cn("font-medium text-sm truncate", activeConvId === conv.id && "text-primary")}>
                                            {conv.otherUser.name}
                                        </h4>
                                        {conv.updatedAt && (
                                            <span className="text-[10px] text-muted-foreground shrink-0">
                                                {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {conv.lastMessage?.content || "No messages"}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-muted/20">
                {activeReceiverId || activeConvId ? (
                    <>
                        {/* Header */}
                        <div className="h-16 border-b border-border bg-card flex items-center px-6 justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                    <UserCircle className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{activeUser?.name || "Loading..."}</h3>
                                    <span className="text-xs text-green-500 flex items-center gap-1">
                                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Online
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                            {isLoadingMsgs && messages.length === 0 ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-muted-foreground mt-10">
                                    <p>No messages yet. Say hello!</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={cn("flex", msg.isMine ? "justify-end" : "justify-start")}>
                                        <div className={cn(
                                            "max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-sm",
                                            msg.isMine
                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                : "bg-card border border-border rounded-tl-none"
                                        )}>
                                            {msg.content}
                                            <div className={cn("text-[10px] mt-1 opacity-70", msg.isMine ? "text-right" : "text-left")}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-card border-t border-border">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-muted px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputText.trim() || isSending}
                                    className="h-12 w-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg">Select a conversation</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            Choose a friend from the left sidebar or visit a profile to start a new chat.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}


export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <MessagesContent />
        </Suspense>
    );
}
