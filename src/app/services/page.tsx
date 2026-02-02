"use client";

import { useScrollAware } from "@/hooks/useScrollAware";
import { AdPanel } from "@/components/dashboard/AdPanel";
import { cn } from "@/lib/utils";

export default function ServicesPage() {
    // Scroll Awareness
    const leftPanel = useScrollAware(3000);
    const rightPanel = useScrollAware(3000);

    return (
        <div className="h-[calc(100vh-4rem)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full">
                {/* Left Content */}
                <div
                    className={cn(
                        "lg:col-span-8 h-full overflow-y-auto border-r border-border bg-background scrollbar-fade",
                        leftPanel.isScrolling && "scrolling"
                    )}
                    onScroll={leftPanel.onScroll}
                >
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold">My Services</h1>
                            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                                + Create Service
                            </button>
                        </div>

                        <div className="bg-card rounded-xl border border-border p-12 text-center">
                            <div className="mx-auto h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">💼</span>
                            </div>
                            <h3 className="text-lg font-semibold">You haven&apos;t created any services yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                Start selling your skills by creating a service package. Define your pricing, timeline, and deliverables.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Content (Ads) */}
                <div
                    className={cn(
                        "lg:col-span-4 h-full overflow-y-auto p-6 border-l border-border/0 scrollbar-fade",
                        rightPanel.isScrolling && "scrolling"
                    )}
                    onScroll={rightPanel.onScroll}
                >
                    <AdPanel />
                </div>
            </div>
        </div>
    );
}
