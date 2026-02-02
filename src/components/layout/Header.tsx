"use client";

import Link from "next/link";
import { Bell, Menu, UserCircle, Settings as SettingsIcon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useUser } from "@/context/UserContext";

export function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
                        <Link
                            href="/?view=notifications"
                            className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors relative"
                        >
                            <Bell className="h-5 w-5" />
                            {/* We can add a red dot here later if we have unread count */}
                        </Link>

                        {/* Profile with Hover Dropdown */}
                        <div className="relative group">
                            <Link
                                href="/profile"
                                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border"
                            >
                                {/* User Name */}
                                <span className="text-sm font-medium hidden sm:block">
                                    {useUser().user?.name?.split(' ')[0] || "User"}
                                </span>

                                {/* Profile Icon */}
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border overflow-hidden ring-offset-background group-hover:ring-2 ring-primary/20">
                                    {useUser().user?.avatarUrl || useUser().user?.image ? (
                                        <img src={useUser().user?.avatarUrl || useUser().user?.image || ""} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                            </Link>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden hidden group-hover:block z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex flex-col py-1">
                                    <Link href="/profile" className="px-4 py-2 text-sm hover:bg-muted text-foreground flex items-center gap-2">
                                        <UserCircle className="h-4 w-4" /> View Profile
                                    </Link>
                                    <Link href="/settings" className="px-4 py-2 text-sm hover:bg-muted text-foreground flex items-center gap-2">
                                        <SettingsIcon className="h-4 w-4" /> Settings
                                    </Link>
                                    <div className="h-px bg-border my-1" />
                                    <button
                                        onClick={() => useUser().logout()}
                                        className="px-4 py-2 text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2 w-full text-left"
                                    >
                                        <LogOut className="h-4 w-4" /> Log Out
                                    </button>
                                </div>
                            </div>
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
