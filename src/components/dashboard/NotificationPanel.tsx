import { useEffect, useState } from "react";
import { getNotifications, NotificationItem } from "@/lib/actions/notifications";
import { respondToFriendRequest, markRequestAsRead } from "@/lib/actions/friends";
import { Bell, Check, X, MessageSquare, UserPlus, Briefcase, Trophy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NotificationPanel() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchData = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Poll every 10 seconds
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleFriendResponse = async (requestId: string, action: "accept" | "reject") => {
        try {
            await respondToFriendRequest(requestId, action);
            // Optimistic update
            setNotifications(prev => prev.filter(n => n.data.requestId !== requestId));
        } catch (error) {
            console.error("Failed to respond to friend request", error);
        }
    };

    const handleDismiss = async (requestId: string) => {
        try {
            await markRequestAsRead(requestId);
            setNotifications(prev => prev.filter(n => n.id !== requestId)); // Use Notif ID (which mirrors request ID here)
        } catch (error) {
            console.error("Failed to dismiss notification", error);
        }
    };

    if (loading) {
        return <div className="p-4 text-center text-muted-foreground animate-pulse">Loading notifications...</div>;
    }

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-64 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4 opacity-20" />
                <p>No new notifications</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {notifications.map((item) => (
                <div key={item.id} className="p-4 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                    {/* Icon based on type */}
                    <div className="mt-1">
                        {item.type === 'friend_request' ? (
                            <div className="h-10 w-10 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center">
                                <UserPlus className="h-5 w-5" />
                            </div>
                        ) : item.type === 'friend_accepted' ? (
                            <div className="h-10 w-10 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center">
                                <Check className="h-5 w-5" />
                            </div>
                        ) : item.type === 'project_bid' ? (
                            <div className="h-10 w-10 bg-purple-500/10 text-purple-600 rounded-full flex items-center justify-center">
                                <Briefcase className="h-5 w-5" />
                            </div>
                        ) : item.type === 'contest_entry' ? (
                            <div className="h-10 w-10 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center">
                                <Trophy className="h-5 w-5" />
                            </div>
                        ) : (
                            <div className="h-10 w-10 bg-purple-500/10 text-purple-600 rounded-full flex items-center justify-center">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-2 opacity-70">
                            {new Date(item.createdAt).toLocaleString()}
                        </p>

                        {/* Actions */}
                        <div className="mt-3">
                            {item.type === 'friend_request' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleFriendResponse(item.data.requestId, 'accept')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        <Check className="h-3.5 w-3.5" /> Accept
                                    </button>
                                    <button
                                        onClick={() => handleFriendResponse(item.data.requestId, 'reject')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-lg hover:bg-muted/80 transition-colors"
                                    >
                                        <X className="h-3.5 w-3.5" /> Reject
                                    </button>
                                </div>
                            )}

                            {item.type === 'friend_accepted' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDismiss(item.data.requestId)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-lg hover:bg-muted/80 transition-colors"
                                    >
                                        <Check className="h-3.5 w-3.5" /> Dismiss
                                    </button>
                                </div>
                            )}

                            {item.type === 'message' && (
                                <Link
                                    href={`/messages?userId=${item.data.senderId}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-lg hover:bg-secondary/80 transition-colors"
                                >
                                    <MessageSquare className="h-3.5 w-3.5" /> Reply
                                </Link>
                            )}

                            {item.type === 'project_bid' && (
                                <Link
                                    href={`/project/${item.data.projectId}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-200 transition-colors"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" /> View Proposal
                                </Link>
                            )}

                            {item.type === 'contest_entry' && (
                                <Link
                                    href={`/contest/${item.data.contestId}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-200 transition-colors"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" /> View Entry
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
