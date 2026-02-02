"use client";

import { FilterSidebar } from "@/components/browse/FilterSidebar";
import Link from "next/link";
import { Search, MapPin, Clock, DollarSign, Star, UserCircle, Briefcase, BookOpen } from "lucide-react";
import { AdPanel } from "@/components/dashboard/AdPanel";
import { RightPanel } from "@/components/dashboard/RightPanel";
import { useState, useEffect } from "react";
import { fetchProjectsAndContests, fetchServices, fetchFreelancers, fetchCourses } from "@/lib/actions/data";
import { useUser } from "@/context/UserContext";
import { useScrollAware } from "@/hooks/useScrollAware";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { ContestCard } from "@/components/dashboard/ContestCard";
import { ServiceCard } from "@/components/dashboard/ServiceCard";
import { BookmarkButton } from "@/components/shared/BookmarkButton";

export default function BrowsePage() {
    const { user, activeMode } = useUser();
    const [activeTab, setActiveTab] = useState("Projects");
    const [category, setCategory] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Define role-based tabs
    const tabs = activeMode === "client"
        ? ["Services", "Freelancers", "Courses", "Projects", "Contests"]
        : ["Projects", "Contests", "Courses", "Freelancers", "Services"];

    // Set default tab based on mode on mount or mode change
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
                let data = [];
                if (activeTab === "Projects") {
                    data = await fetchProjectsAndContests(category, skills);
                    data = data.filter((i: any) => i.type === 'PROJECT');
                } else if (activeTab === "Contests") {
                    data = await fetchProjectsAndContests(category, skills);
                    data = data.filter((i: any) => i.type === 'CONTEST');
                } else if (activeTab === "Services") {
                    data = await fetchServices(category, skills);
                } else if (activeTab === "Freelancers") {
                    data = await fetchFreelancers(category, skills);
                } else if (activeTab === "Courses") {
                    data = await fetchCourses(category, skills);
                }
                if (isMounted) setItems(data);
            } catch (err) {
                console.error("Failed to load data", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadData();
        return () => { isMounted = false; };
    }, [activeTab, category, skills]);

    // Clear skills when category changes to avoid invalid states
    useEffect(() => {
        setSkills([]);
    }, [category]);

    // Scroll Awareness
    const filterPanel = useScrollAware(3000);
    const resultsPanel = useScrollAware(3000);

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-background">
            {/* Search Header - Fixed at Top */}
            <div className="shrink-0 p-6 border-b border-border bg-background z-10">
                <div className="flex flex-col md:flex-row justify-between gap-4 items-center max-w-[1920px] mx-auto w-full">
                    <div className="relative w-full md:max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab.toLowerCase()}...`}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div className="flex bg-muted p-1 rounded-lg shrink-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area - Split Panels */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-0 max-w-[1920px] mx-auto w-full h-full">

                {/* Filter Panel (Left) ~ 3 cols */}
                <aside
                    className={cn(
                        "hidden md:block md:col-span-3 border-r border-border h-full overflow-y-auto bg-card/50 scrollbar-fade",
                        filterPanel.isScrolling && "scrolling"
                    )}
                    onScroll={filterPanel.onScroll}
                >
                    <div className="p-6">
                        <FilterSidebar
                            selectedCategory={category}
                            onCategoryChange={setCategory}
                            selectedSkills={skills}
                            onSkillsChange={setSkills}
                        />
                    </div>
                </aside>

                {/* Results Panel (Center) ~ 6 cols */}
                <div
                    className={cn(
                        "col-span-1 md:col-span-9 h-full overflow-y-auto bg-background scrollbar-fade",
                        resultsPanel.isScrolling && "scrolling"
                    )}
                    onScroll={resultsPanel.onScroll}
                >
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center pb-2">
                            <h2 className="text-lg font-semibold">
                                {isLoading ? "Loading..." : `${items.length} Results Found`}
                            </h2>
                            <div className="text-sm text-muted-foreground">
                                Sort by: <span className="font-medium text-foreground cursor-pointer">Newest</span>
                            </div>
                        </div>

                        {/* Content List */}

                        {isLoading && (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted/20 animate-pulse rounded-xl" />)}
                            </div>
                        )}

                        {!isLoading && items.length === 0 && (
                            <div className="text-center py-12 bg-card rounded-xl border border-border">
                                <p className="text-muted-foreground">No matches found. Try adjusting your filters.</p>
                            </div>
                        )}

                        {!isLoading && items.map((item: any) => (
                            <div key={item._id} className="contents">
                                {/* Render Card Content Based on Type */}

                                {/* FREELANCER CARD */}
                                {activeTab === "Freelancers" && (
                                    <div className="group relative bg-card p-6 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-all flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            {item.avatarUrl ? <img src={item.avatarUrl} className="h-12 w-12 rounded-full object-cover" /> : <UserCircle className="h-6 w-6" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold group-hover:text-primary transition-colors">{item.name || "Freelancer"}</h3>
                                                    <p className="text-sm text-muted-foreground">{item.title || "No Title"}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <BookmarkButton
                                                        itemId={item._id}
                                                        itemType="freelancer"
                                                        initialSavedState={item.isSaved}
                                                        activeColor="text-purple-500"
                                                    />
                                                    <Link href={`/profile/${item._id}`} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                        View Profile
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {item.skills?.slice(0, 5).map((skill: string) => (
                                                    <span key={skill} className="text-xs bg-secondary px-2 py-1 rounded-md">{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* SERVICE CARD */}
                                {activeTab === "Services" && (
                                    <ServiceCard item={item} />
                                )}

                                {/* PROJECT/CONTEST CARDS */}
                                {(activeTab === "Projects" || activeTab === "Contests") && (
                                    item.type === "CONTEST"
                                        ? <ContestCard item={item} />
                                        : <ProjectCard item={item} />
                                )}

                                {/* COURSE CARD */}
                                {activeTab === "Courses" && (
                                    <div className="group relative bg-card p-6 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-all flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{item.title}</h3>
                                            <div className="flex items-center gap-2">
                                                <BookmarkButton
                                                    itemId={item._id}
                                                    itemType="course"
                                                    initialSavedState={item.isSaved}
                                                    activeColor="text-purple-500"
                                                />
                                                <div className="font-bold text-foreground">${item.price}</div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                            <span className="px-2 py-1 bg-muted rounded">{item.category}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {item.instructor}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {item.skills?.map((tag: string) => (
                                                <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div >
        </div >
    );
}
