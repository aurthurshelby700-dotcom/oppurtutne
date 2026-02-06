"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useScrollAware } from "@/hooks/useScrollAware";
import { cn } from "@/lib/utils";
import { getSavedItems } from "@/lib/actions/saved";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { ContestCard } from "@/components/dashboard/ContestCard";
import { ServiceCard } from "@/components/dashboard/ServiceCard";
import { FreelancerCard } from "@/components/shared/FreelancerCard";
import { AdPanel } from "@/components/dashboard/AdPanel";
import { RightPanel } from "@/components/dashboard/RightPanel";
import { BookmarkButton } from "@/components/shared/BookmarkButton"; // Will verify path
import Link from "next/link";
import { UserCircle, BookOpen, Loader2 } from "lucide-react";

export default function SavedPage() {
    const { user, activeMode } = useUser();
    const [activeTab, setActiveTab] = useState("Projects");
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Define role-based tabs
    // Map UI tab name to db itemType
    // "Projects" -> "project"
    const tabMap: Record<string, string> = {
        "Projects": "project",
        "Contests": "contest",
        "Services": "service",
        "Freelancers": "freelancer",
        "Courses": "course"
    };

    const tabs = activeMode === "client"
        ? ["Services", "Freelancers", "Courses", "Projects", "Contests"]
        : ["Projects", "Contests", "Courses", "Freelancers", "Services"];

    useEffect(() => {
        if (activeMode === "client") {
            setActiveTab("Services");
        } else {
            setActiveTab("Projects");
        }
    }, [activeMode]);

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            setIsLoading(true);
            try {
                const itemType = tabMap[activeTab];
                if (itemType) {
                    // This action returns populated items
                    const data = await getSavedItems(itemType);
                    if (isMounted) setItems(data);
                }
            } catch (err) {
                console.error("Failed to load saved items", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadData();
        return () => { isMounted = false; };
    }, [activeTab]);

    // Scroll Awareness
    const filterPanel = useScrollAware(3000); // Placeholder for consistency 
    const resultsPanel = useScrollAware(3000);

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-background">


            {/* Split Layout */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-0 max-w-[1920px] mx-auto w-full h-full">

                <div
                    className={cn(
                        "col-span-1 md:col-span-8 h-full overflow-y-auto bg-background scrollbar-fade border-r border-border",
                        resultsPanel.isScrolling && "scrolling"
                    )}
                    onScroll={resultsPanel.onScroll}
                >
                    <div className="p-6 space-y-6">

                        {/* Center Header: Title -> Tabs */}
                        <div className="space-y-4">
                            <h1 className="text-2xl font-bold bg-background sticky top-0 z-10 pb-2">
                                Saved {activeTab}
                            </h1>

                            <div className="flex bg-muted p-1 rounded-lg shrink-0 overflow-x-auto max-w-full inline-flex">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                                            activeTab === tab
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="border-b border-border pb-2">
                                {/* Optional: Add search or sort controls here if needed later */}
                            </div>
                        </div>
                        {isLoading && (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}

                        {!isLoading && items.length === 0 && (
                            <div className="text-center py-12 bg-card rounded-xl border border-border">
                                <p className="text-muted-foreground">You haven't saved any {activeTab.toLowerCase()} yet.</p>
                                <Link
                                    href="/browse"
                                    className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90"
                                >
                                    Browse Now
                                </Link>
                            </div>
                        )}

                        {!isLoading && items.map((item: any) => (
                            <div key={item._id} className="relative group">
                                {/* Wrap card in relative container to position BookmarkButton absolutely if needed, 
                                    but standard cards usually have action areas. 
                                    For now, we'll render the standard card and overlay the bookmark button 
                                    OR inject it if the card components support children/actions.
                                    
                                    Since we want to be "lazy" about modifying existing cards too much,
                                    let's wrap them or overlay the button.
                                */}

                                {/* Wrap card in relative container for inline cards that don't have built-in bookmark buttons */}
                                {/* Removed absolute wrapper, integrated into cards below */}

                                {activeTab === "Freelancers" && (
                                    <FreelancerCard item={{ ...item, isSaved: true }} />
                                )}

                                {activeTab === "Services" && (
                                    <ServiceCard item={{ ...item, isSaved: true }} />
                                )}

                                {(activeTab === "Projects" || activeTab === "Contests") && (
                                    (item.type === "CONTEST" || activeTab === "Contests")
                                        ? <ContestCard item={{ ...item, isSaved: true }} />
                                        : <ProjectCard item={{ ...item, isSaved: true }} />
                                )}

                                {activeTab === "Courses" && (
                                    <div className="bg-card p-6 rounded-xl border border-border hover:border-primary/50">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-semibold pr-4">{item.title}</h3>
                                            <div className="flex items-center gap-2">
                                                <BookmarkButton
                                                    itemId={item._id}
                                                    itemType="course"
                                                    initialSavedState={true}
                                                    activeColor="text-purple-500"
                                                />
                                                <div className="font-bold text-foreground">${item.price}</div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel (Ads) ~ 33% */}
                <div
                    className={cn(
                        "hidden md:block md:col-span-4 h-full overflow-y-auto p-6 scrollbar-fade",
                        // rightPanel check if needed
                    )}
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
