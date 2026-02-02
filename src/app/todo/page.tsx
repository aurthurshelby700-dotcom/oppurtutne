"use client";

import { useState } from "react";
import { useScrollAware } from "@/hooks/useScrollAware";
import { Feed } from "@/components/dashboard/Feed";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { AdPanel } from "@/components/dashboard/AdPanel";
import { RightPanel } from "@/components/dashboard/RightPanel";
import { ToDoList } from "@/components/dashboard/ToDoList";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

export default function TodoPage() {
    const { activeMode } = useUser();

    // Scroll Awareness
    const leftPanel = useScrollAware(3000);
    const rightPanel = useScrollAware(3000);

    return (
        <div className="h-[calc(100vh-4rem)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full">
                {/* Left Content (ONE Scrollbar for Welcome + Tabs + Content) */}
                <div
                    className={cn(
                        "lg:col-span-8 h-full overflow-y-auto border-r border-border bg-background scrollbar-fade",
                        leftPanel.isScrolling && "scrolling"
                    )}
                    onScroll={leftPanel.onScroll}
                >
                    <div className="p-6">
                        <WelcomeHeader />

                        <h2 className="text-lg font-semibold mb-4 px-1">My To-Do List</h2>

                        {/* Content Area */}
                        <div className="min-h-0">
                            <ToDoList />
                        </div>
                    </div>
                </div>

                {/* Right Content (Ads) - Independent Scroll */}
                <div
                    className={cn(
                        "lg:col-span-4 h-full overflow-y-auto p-6 border-l border-border/0 scrollbar-fade",
                        rightPanel.isScrolling && "scrolling"
                    )}
                    onScroll={rightPanel.onScroll}
                >
                    <div className="space-y-6">
                        <AdPanel />
                        <RightPanel />
                    </div>
                </div>
            </div>
        </div>
    );
}
