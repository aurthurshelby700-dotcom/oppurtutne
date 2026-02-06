
import React from 'react';
import { INotification } from '@/models/Notification';
import { formatDistanceToNow } from 'date-fns';
import {
    UserPlus,
    MessageCircle,
    Briefcase,
    Trophy,
    Star,
    Eye,
    Bell
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NotificationItemProps {
    notification: INotification;
    onRead: (id: string) => void;
    onClose: () => void;
}

export function NotificationItem({ notification, onRead, onClose }: NotificationItemProps) {
    const router = useRouter();

    const handleClick = () => {
        const id = notification.relatedId?.toString();

        // 404 Prevention: Check if ID is required but missing
        const needsId = !["friend_request_accepted", "new_message", "friend_request_received", "service_request_received", "service_request_accepted"].includes(notification.type);
        if (needsId && !id) {
            console.warn("Notification preview click blocked: missing relatedId");
            return;
        }

        // @ts-ignore - _id is present in mongoose docs
        onRead(notification._id);
        onClose();

        // ROUTING MAP (MANDATORY)
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

    const getIcon = () => {
        switch (notification.type) {
            case "friend_request_received":
            case "friend_request_accepted":
                return <UserPlus className="h-4 w-4 text-blue-500" />;
            case "new_message":
                return <MessageCircle className="h-4 w-4 text-green-500" />;
            case "project_bid_received":
            case "project_bid_accepted":
            case "project_bid_rejected":
                return <Briefcase className="h-4 w-4 text-purple-500" />;
            case "contest_entry_received":
            case "contest_entry_awarded":
            case "contest_entry_rejected":
            case "contest_handover_submitted":
            case "contest_handover_accepted":
            case "contest_handover_disputed":
            case "comment_on_contest_entry":
                return <Trophy className="h-4 w-4 text-orange-500" />;
            case "project_agreement_signed":
            case "project_handover_submitted":
            case "project_handover_accepted":
            case "project_handover_disputed":
                return <Briefcase className="h-4 w-4 text-purple-500" />;
            case "service_request_received":
            case "service_request_accepted":
                return <Star className="h-4 w-4 text-yellow-500" />;
            case "profile_view":
                return <Eye className="h-4 w-4 text-gray-500" />;
            default:
                return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`
                flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b border-border last:border-0 transition-colors
                ${!notification.isRead ? 'bg-primary/5' : ''}
            `}
        >
            <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center bg-muted shrink-0`}>
                {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${!notification.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
            </div>
            {!notification.isRead && (
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
            )}
        </div>
    );
}
