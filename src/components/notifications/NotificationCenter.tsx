"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Bell, CheckCheck, Loader2, UserPlus, MessageCircle, Briefcase, Trophy, Star, Eye } from "lucide-react";
import { INotification } from "@/models/Notification";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    onMarkAllRead: () => void;
    onRead: (id: string | any) => void;
}

export function NotificationCenter({ isOpen, onClose, onMarkAllRead, onRead }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async (pageNum: number, isNewFilter = false) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/notifications?filter=${filter}&page=${pageNum}&limit=20`);
            if (res.ok) {
                const data = await res.json();
                if (isNewFilter) {
                    setNotifications(data);
                } else {
                    setNotifications(prev => [...prev, ...data]);
                }
                setHasMore(data.length === 20);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setPage(1);
            fetchNotifications(1, true);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, filter]);

    const handleScroll = () => {
        if (!scrollRef.current || isLoading || !hasMore) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchNotifications(nextPage);
        }
    };

    const handleMarkAllReadLocal = () => {
        onMarkAllRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleAction = (notification: INotification & { _id: any }) => {
        const id = notification.relatedId?.toString();

        // 404 Prevention: Check if ID is required but missing
        const needsId = !["friend_request_accepted", "new_message", "friend_request_received", "service_request_received", "service_request_accepted"].includes(notification.type);
        if (needsId && !id) {
            console.warn("Notification action blocked: missing relatedId");
            return;
        }

        onRead(notification._id);
        onClose();

        // ROUTING MAP (MANDATORY)
        // Check relatedType first if available, otherwise fallback to specific types
        const relType = notification.relatedType;

        if (relType === "message" || notification.type === "new_message") {
            router.push('/messages');
            return;
        }

        // Handover / Agreement / Rating logic with auto-open flags
        if (notification.type.includes("agreement")) {
            const baseUrl = relType === "contest" ? `/contest/${id}` : `/project/${id}`;
            const action = relType === "contest" ? "sign-agreement" : "agreement";
            router.push(`${baseUrl}?action=${action}`);
            return;
        }

        if (notification.type.includes("handover_submitted")) {
            const baseUrl = relType === "contest" ? `/contest/${id}` : `/project/${id}`;
            router.push(`${baseUrl}?action=handover-review`);
            return;
        }

        if (notification.type.includes("handover_accepted")) {
            const baseUrl = relType === "contest" ? `/contest/${id}` : `/project/${id}`;
            router.push(`${baseUrl}?action=rate`);
            return;
        }

        // Rating available - freelancer can rate client
        if (notification.type === "rating_available") {
            const baseUrl = relType === "contest" ? `/contest/${id}` : `/project/${id}`;
            router.push(`${baseUrl}?action=rate-client`);
            return;
        }

        // Review received - navigate to reviewer's profile
        if (notification.type === "review_received") {
            // relatedId contains the reviewer's user ID
            router.push(`/profile/${id}`);
            return;
        }

        // Default item views
        if (relType === "project" || notification.type.startsWith("project_")) {
            const tab = notification.type === "project_bid_received" ? "?tab=bids" : "";
            router.push(`/project/${id}${tab}`);
            return;
        }

        if (relType === "contest" || notification.type.startsWith("contest_")) {
            const tab = notification.type === "contest_entry_received" ? "?tab=entries" : "";
            router.push(`/contest/${id}${tab}`);
            return;
        }

        if (relType === "user" || notification.type === "friend_request_received") {
            router.push('/dashboard?action=friend-requests');
            return;
        }

        // Fallback
        if (id && relType) {
            router.push(`/${relType}/${id}`);
        } else if (id && notification.type.includes("project")) {
            router.push(`/project/${id}`);
        } else if (id && notification.type.includes("contest")) {
            router.push(`/contest/${id}`);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "friend_request_received":
            case "friend_request_accepted":
                return <UserPlus className="h-5 w-5 text-blue-500" />;
            case "new_message":
                return <MessageCircle className="h-5 w-5 text-green-500" />;
            case "project_bid_received":
            case "project_bid_accepted":
            case "project_bid_rejected":
            case "project_agreement_signed":
            case "project_handover_submitted":
            case "project_handover_accepted":
            case "project_handover_disputed":
                return <Briefcase className="h-5 w-5 text-purple-500" />;
            case "contest_entry_received":
            case "contest_entry_awarded":
            case "contest_entry_rejected":
            case "contest_handover_submitted":
            case "contest_handover_accepted":
            case "contest_handover_disputed":
                return <Trophy className="h-5 w-5 text-orange-500" />;
            case "service_request_received":
            case "service_request_accepted":
                return <Star className="h-5 w-5 text-yellow-500" />;
            case "profile_view":
                return <Eye className="h-5 w-5 text-gray-500" />;
            default:
                return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    const getActionButton = (notification: INotification & { _id: any }) => {
        const type = notification.type;
        switch (type) {
            case "friend_request_received":
                return "View Requests";
            case "project_agreement_signed":
                return "View Agreement";
            case "project_handover_submitted":
            case "contest_handover_submitted":
                return "Review Files";
            case "project_handover_accepted":
            case "contest_handover_accepted":
                return "Rate Now";
            case "project_bid_received":
                return "View Bids";
            case "contest_entry_received":
                return "View Entries";
            case "new_message":
                return "Reply";
            default:
                return "View Details";
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 z-[9998]"
                onClick={onClose}
            />

            <div className="relative bg-card border border-border rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 z-[9999]">
                {/* Header */}
                <div className="p-6 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Bell className="h-6 w-6 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleMarkAllReadLocal}
                                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                            >
                                <CheckCheck className="h-4 w-4" />
                                Mark all as read
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter("all")}
                            className={cn(
                                "px-6 py-2 rounded-full text-sm font-bold transition-all",
                                filter === "all" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter("unread")}
                            className={cn(
                                "px-6 py-2 rounded-full text-sm font-bold transition-all",
                                filter === "unread" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            Unread
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/10 custom-scrollbar"
                >
                    {notifications.length > 0 ? (
                        <>
                            {notifications.map((notification: any) => (
                                <div
                                    key={notification._id}
                                    onClick={() => !notification.isRead && onRead(notification._id)}
                                    className={cn(
                                        "group relative bg-card border border-border rounded-xl p-5 transition-all duration-200 hover:shadow-lg",
                                        !notification.isRead && "border-primary/30 ring-1 ring-primary/10"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "mt-1 p-3 rounded-xl shrink-0 transition-transform group-hover:scale-110",
                                            !notification.isRead ? "bg-primary/10" : "bg-muted"
                                        )}>
                                            {getIcon(notification.type)}
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                    {notification.type.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>

                                            <p className={cn(
                                                "text-sm leading-relaxed",
                                                !notification.isRead ? "text-foreground font-medium" : "text-muted-foreground"
                                            )}>
                                                {notification.message}
                                            </p>

                                            <div className="pt-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAction(notification);
                                                    }}
                                                    disabled={!notification.relatedId && !["friend_request_accepted", "new_message", "friend_request_received", "service_request_received", "service_request_accepted"].includes(notification.type)}
                                                    title={(!notification.relatedId && !["friend_request_accepted", "new_message", "friend_request_received", "service_request_received", "service_request_accepted"].includes(notification.type)) ? "Item no longer available" : ""}
                                                    className="px-5 py-2 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary/10 disabled:hover:text-primary"
                                                >
                                                    {(!notification.relatedId && !["friend_request_accepted", "new_message", "friend_request_received", "service_request_received", "service_request_accepted"].includes(notification.type)) ? "Unavailable" : getActionButton(notification)}
                                                </button>
                                            </div>
                                        </div>

                                        {!notification.isRead && (
                                            <div className="absolute top-5 right-5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            )}
                        </>
                    ) : !isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
                                <Bell className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No notifications yet</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                                We'll notify you when something important happens!
                            </p>
                        </div>
                    ) : (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
