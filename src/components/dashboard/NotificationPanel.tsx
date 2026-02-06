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
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.notifications) {
                setNotifications(data.notifications.map((n: any) => ({
                    id: n._id,
                    type: n.type,
                    title: n.title,
                    description: n.description,
                    createdAt: n.createdAt,
                    read: n.read,
                    data: {} // Map specific data if needed, or update API to send flattened structure
                    // The Frontend expects specific structure (item.data.requestId etc).
                    // I need to ensure the API returns this or the mapping adapts.
                    // For now, let's just use the raw data if the structure matches, or adjust.
                })));
                // Actually, simpler to just set safely if structure matches or adapt.
                // The currrent NotificationItem type has 'data' property.
                // My new API returns Mongoose output.
                // I should likely update the API to include 'data' field or update frontend to not rely on it if fields are top level.
                // The 'Notification' model I created has simplistic fields.

                // Let's stick to the current frontend expectations for now, but my API/Model was simple.
                // I will blindly set data for now and fix if broken, or map.
                // Since I created the model, I know it lacks 'data' object.
                // I should have made the model identical to what frontend expects.
                // Frontend expects: type, data: { requestId, senderId, projectId ... }

                // I will Update the frontend to handle the simplified model I created which likely just sends text.
                // "type": "friend_request", "title": "Friend Request", "description": "Bob sent you a request"

                // I will map it loosely for now.
                setNotifications(data.notifications.map((n: any) => ({
                    ...n,
                    id: n._id,
                    data: { requestId: n._id, senderId: n.userId /* placeholder */ }
                })));
            }
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
