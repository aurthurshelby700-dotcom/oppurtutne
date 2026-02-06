"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useNotifications } from "@/hooks/useNotifications";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isFullViewOpen, closeFullView, markAllAsRead, markAsRead } = useNotifications();
    const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname?.startsWith("/onboarding");

    if (isAuthPage) {
        return <main className="w-full h-screen">{children}</main>;
    }

    return (
        <>
            <Header />
            <div className="flex flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden">
                <Sidebar />
                <div className="flex-1 min-w-0 animate-in fade-in duration-500 overflow-hidden">
                    {children}
                </div>
            </div>

            <NotificationCenter
                isOpen={isFullViewOpen}
                onClose={closeFullView}
                onMarkAllRead={markAllAsRead}
                onRead={markAsRead}
            />
        </>
    );
}
