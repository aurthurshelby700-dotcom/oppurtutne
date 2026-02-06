"use client";

import Link from "next/link";
import { Bell, Menu, UserCircle, Settings as SettingsIcon, LogOut, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

function NotificationWrapper() {
    const {
        notifications,
        unreadCount,
        togglePanel,
        closePanel,
        isOpen,
        markAsRead,
        markAllAsRead,
        isFullViewOpen,
        openFullView,
        closeFullView
    } = useNotifications();

    // Close panel when clicking the bell toggle logic is handled by the wrapper ref in the panel if we passed the ref, 
    // but here we have a simpler separate button. 
    // The panel handles outside clicks, but we need to ensure clicking the bell doesn't immediately re-open it if it bubbled.
    // However, since the button is outside the panel, the panel's outside click handler might fire.
    // We'll rely on the panel's outside click closer and the button's toggle.
    // To prevent conflict, the button click usually needs to stop propagation if inside the click-outside logic, 
    // OR we just use a simple state toggle that works nicely if the click-outside doesn't cover the button itself.
    // Best pattern: Button toggles. If open, outside click closes. 
    // If we click button while open: 
    // 1. Button click -> toggles to false. 
    // 2. Panel outside click -> (if button is outside) closes to false.
    // Result: close. Correct.
    // If we click button while closed:
    // 1. Button click -> toggles to true.
    // Result: open. Correct.

    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    togglePanel();
                }}
                className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors relative outline-none focus:ring-2 focus:ring-primary/20"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background animate-pulse" />
                )}
            </button>

            <NotificationPanel
                notifications={notifications}
                onRead={markAsRead}
                onMarkAllRead={markAllAsRead}
                onViewAll={openFullView}
                onClose={closePanel}
                isOpen={isOpen}
            />
        </div>
    );
}

export function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { role, activeMode, setActiveMode, user, logout } = useUser();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <button
                        className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-xl">O</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight hidden sm:block">Opportune</span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    {/* Mode Toggle for "Both" Role */}
                    {role === "both" && (
                        <div className="hidden md:flex bg-muted rounded-full p-1 border border-border">
                            <button
                                onClick={() => setActiveMode("freelancer")}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-medium rounded-full transition-all",
                                    activeMode === "freelancer" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Freelancer
                            </button>
                            <button
                                onClick={() => setActiveMode("client")}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-medium rounded-full transition-all",
                                    activeMode === "client" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Client
                            </button>
                        </div>
                    )}

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <NotificationWrapper />

                        {/* Profile with Click Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    setIsProfileOpen(!isProfileOpen);
                                }}
                                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                {/* User Name */}
                                <span className="text-sm font-medium hidden sm:block">
                                    {(() => {
                                        const u = user?.username;
                                        if (u && u !== "undefined" && u !== "null") return u;
                                        const n = user?.name?.split(' ')[0];
                                        if (n && n !== "undefined" && n !== "null") return n;
                                        return "User";
                                    })()}
                                </span>

                                {/* Profile Icon */}
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border overflow-hidden ring-offset-background hover:ring-2 ring-primary/20">
                                    {user?.profileImageUrl || user?.avatarUrl || user?.image ? (
                                        <img src={user?.profileImageUrl || user?.avatarUrl || user?.image || ""} alt={user?.username || "Profile"} className="h-full w-full object-cover" />
                                    ) : (
                                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <>
                                    {/* Backdrop to close on click outside */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileOpen(false)}
                                    />

                                    <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex flex-col py-1">
                                            <Link
                                                href="/profile"
                                                className="px-4 py-2 text-sm hover:bg-muted text-foreground flex items-center gap-2"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                <UserCircle className="h-4 w-4" /> View Profile
                                            </Link>
                                            <Link
                                                href="/wallet"
                                                className="px-4 py-2 text-sm hover:bg-muted text-foreground flex items-center gap-2"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                <DollarSign className="h-4 w-4" /> Wallet
                                            </Link>
                                            <Link
                                                href="/verification"
                                                className="px-4 py-2 text-sm hover:bg-muted text-foreground flex items-center gap-2"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                                Verification
                                            </Link>
                                            <Link
                                                href="/settings"
                                                className="px-4 py-2 text-sm hover:bg-muted text-foreground flex items-center gap-2"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                <SettingsIcon className="h-4 w-4" /> Settings
                                            </Link>
                                            <div className="h-px bg-border my-1" />
                                            <button
                                                onClick={() => {
                                                    setIsProfileOpen(false);
                                                    logout();
                                                }}
                                                className="px-4 py-2 text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2 w-full text-left"
                                            >
                                                <LogOut className="h-4 w-4" /> Log Out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu (Simple overlay for now) */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b border-border p-4 shadow-lg animate-in slide-in-from-top-2">
                    <nav className="flex flex-col gap-2">
                        {["Dashboard", "Browse", "Services", "Messages", "Saved"].map((item) => (
                            <Link
                                key={item}
                                href={item === "Dashboard" ? "/" : `/${item.toLowerCase()}`}
                                className="px-4 py-3 rounded-md hover:bg-muted text-sm font-medium"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {item}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}
