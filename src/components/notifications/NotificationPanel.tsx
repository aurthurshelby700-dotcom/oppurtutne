
import React, { useRef, useEffect, useState } from 'react';
import { INotification } from '@/models/Notification';
import { NotificationItem } from './NotificationItem';
import { Bell, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
    notifications: INotification[];
    onRead: (id: string) => void;
    onMarkAllRead: () => void;
    onViewAll: () => void;
    onClose: () => void;
    isOpen: boolean;
}

export function NotificationPanel({
    notifications,
    onRead,
    onMarkAllRead,
    onViewAll,
    onClose,
    isOpen
}: NotificationPanelProps) {
    const listRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const latestNotifications = notifications.slice(0, 5);

    return (
        <div
            ref={panelRef}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
        >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                <h3 className="font-bold text-sm">Recent Notifications</h3>
                <button
                    onClick={() => onMarkAllRead()}
                    title="Mark all as read"
                    className="p-1.5 hover:bg-white text-muted-foreground hover:text-primary rounded-lg transition-all"
                >
                    <CheckCheck className="h-4 w-4" />
                </button>
            </div>

            {/* List */}
            <div
                ref={listRef}
                className="max-h-[60vh] overflow-y-auto"
            >
                {latestNotifications.length > 0 ? (
                    latestNotifications.map((notification) => (
                        <NotificationItem
                            // @ts-ignore
                            key={notification._id}
                            notification={notification}
                            onRead={onRead}
                            onClose={onClose}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <Bell className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm">No notifications yet</p>
                    </div>
                )}
            </div>

            {/* View All Button */}
            <div className="p-2 border-t border-border bg-muted/20">
                <button
                    onClick={onViewAll}
                    className="w-full py-2.5 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-lg transition-all"
                >
                    View All Notifications
                </button>
            </div>
        </div>
    );
}
