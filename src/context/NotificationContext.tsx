"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { INotification } from '@/models/Notification';

interface NotificationContextType {
    notifications: INotification[];
    unreadCount: number;
    isLoading: boolean;
    isOpen: boolean;
    isFullViewOpen: boolean;
    togglePanel: () => void;
    closePanel: () => void;
    toggleFullView: () => void;
    closeFullView: () => void;
    openFullView: () => void;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isFullViewOpen, setIsFullViewOpen] = useState(false);
    const pollingInterval = useRef<NodeJS.Timeout | null>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: INotification) => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        pollingInterval.current = setInterval(fetchNotifications, 30000);
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [fetchNotifications]);

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n =>
            // @ts-ignore
            (n._id === id || n.id === id) ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        try {
            await fetch('/api/notifications/read-all', { method: 'PUT' });
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const value = {
        notifications,
        unreadCount,
        isLoading,
        isOpen,
        isFullViewOpen,
        togglePanel: () => setIsOpen(prev => !prev),
        closePanel: () => setIsOpen(false),
        toggleFullView: () => setIsFullViewOpen(prev => !prev),
        closeFullView: () => setIsFullViewOpen(false),
        openFullView: () => {
            setIsFullViewOpen(true);
            setIsOpen(false);
        },
        markAsRead,
        markAllAsRead,
        fetchNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
}
