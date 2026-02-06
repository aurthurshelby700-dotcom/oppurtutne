"use client";

import { useUser } from "@/context/UserContext";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Search,
    Briefcase,
    MessageSquare,
    Bookmark,
    User,
    Plus,
    Folder,
    ListTodo,
    ScrollText
} from "lucide-react";
import { ScrollContainer } from "@/components/ui/ScrollContainer";


export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const { logout, activeMode, user } = useUser();

    const navItems = [
        {
            label: "Home",
            href: "/",
            icon: LayoutDashboard,
            visible: true
        },
        {
            label: "Browse",
            href: "/browse",
            icon: Search,
            visible: true
        },
        {
            label: "Messages",
            href: "/messages",
            icon: MessageSquare,
            visible: true
        },
        {
            label: "My Projects",
            href: "/my-projects",
            icon: Folder,
            visible: activeMode === "client"
        },
        {
            label: "My Services",
            href: "/my-services",
            icon: Briefcase,
            visible: activeMode === "freelancer"
        },
        {
            label: "To Do List",
            href: "/todo",
            icon: ListTodo,
            visible: activeMode === "freelancer"
        },
        {
            label: "Saved",
            href: "/saved",
            icon: Bookmark,
            visible: true
        },
        {
            label: "Rules",
            href: "/rules",
            icon: ScrollText,
            visible: true
        },
        {
            label: "Terms & Conditions",
            href: "/terms",
            icon: ScrollText,
            visible: true
        },
    ];

    return (
        <aside className={cn("w-64 border-r border-border bg-card flex flex-col h-full hidden md:flex", className)}>
            <ScrollContainer className="flex-1">
                <div className="py-6 px-4 space-y-2">
                    {navItems.filter(item => item.visible).map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </ScrollContainer>

            <div className="p-4 border-t border-border mt-auto">
                <p className="text-xs text-muted-foreground text-center">
                    &copy; 2026 Opportune
                </p>
            </div>
        </aside>
    );
}
