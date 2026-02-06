"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { BrowseSidebar } from "@/components/browse/BrowseSidebar";
import { BrowseHeader } from "@/components/browse/BrowseHeader";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { ContestCard } from "@/components/dashboard/ContestCard";
import { ServiceCard } from "@/components/dashboard/ServiceCard";
import { FreelancerCard } from "@/components/shared/FreelancerCard";
import { useDebounce } from "@/hooks/useDebounce";
import { Loader2 } from "lucide-react";

export default function BrowsePage() {
    const { activeMode } = useUser();

    // Core State
    const [type, setType] = useState<string>(activeMode === "client" ? "services" : "projects");
    const [query, setQuery] = useState("");
    const [filters, setFilters] = useState<any>({
        jobTitles: [],
        skills: [],
        timePosted: "anytime"
    });

    // Data State
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const debouncedQuery = useDebounce(query, 500);

    // Sync default type with activeMode
    useEffect(() => {
        setType(activeMode === "client" ? "services" : "projects");
    }, [activeMode]);

    // Fetch Logic
    useEffect(() => {
        const fetchResults = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({
                    type,
                    query: debouncedQuery,
                    page: page.toString(),
                    timePosted: filters.timePosted
                });

                if (filters.jobTitles?.length) {
                    params.set("jobTitles", filters.jobTitles.join(","));
                }
                if (filters.skills?.length) {
                    params.set("skills", filters.skills.join(","));
                }

                const res = await fetch(`/api/browse?${params.toString()}`);
                const data = await res.json();

                if (data.results) {
                    setItems(data.results);
                    setTotal(data.total || 0);
                }
            } catch (err) {
                console.error("Fetch failed", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [type, debouncedQuery, filters, page]);

    // Reset page on filter/type change
    useEffect(() => {
        setPage(1);
    }, [type, debouncedQuery, filters]);

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">

            {/* LEFT PANEL: Filters (30%) */}
            <aside className="hidden md:flex md:w-[30%] lg:w-[25%] flex-col border-r border-border bg-card/30">
                <ScrollContainer className="flex-1">
                    <BrowseSidebar
                        type={type}
                        filters={filters}
                        setFilters={setFilters}
                    />
                </ScrollContainer>
            </aside>

            {/* RIGHT PANEL: Results (70%) */}
            <main className="flex-1 flex flex-col min-w-0 bg-background/50">
                <ScrollContainer className="flex-1" innerClassName="max-w-6xl mx-auto w-full p-4 md:p-8">

                    {/* Header: Search & Toggle */}
                    <BrowseHeader
                        type={type}
                        setType={setType}
                        query={query}
                        setQuery={setQuery}
                    />

                    {/* Results Count & Sort */}
                    <div className="flex items-center justify-between mb-6 animate-in fade-in duration-500">
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                            {isLoading ? "Fetching..." : `${total} ${type} Found`}
                        </h2>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Order by</span>
                            <span className="font-bold text-primary cursor-pointer hover:underline underline-offset-4">Latest</span>
                        </div>
                    </div>

                    {/* Content List */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="font-medium animate-pulse">Searching for best matches...</p>
                            </div>
                        ) : items.length > 0 ? (
                            items.map((item, idx) => (
                                <div
                                    key={item._id}
                                    className="animate-in fade-in slide-in-from-bottom-4"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {type === "projects" && <ProjectCard item={item} />}
                                    {type === "contests" && <ContestCard item={item} />}
                                    {type === "services" && <ServiceCard item={item} />}
                                    {type === "freelancers" && <FreelancerCard item={item} />}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-3xl bg-card/20 animate-in zoom-in-95 duration-500">
                                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <Search className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">
                                    {type === "courses" ? "Courses Coming Soon!" : "No matches found"}
                                </h3>
                                <p className="text-muted-foreground max-w-xs mx-auto">
                                    {type === "courses"
                                        ? "We're currently building our learning platform. Stay tuned for exciting courses!"
                                        : "Try adjusting your filters or search keywords to find what you're looking for."}
                                </p>
                                {type !== "courses" && (
                                    <button
                                        onClick={() => { setFilters({ skills: [], timePosted: "anytime" }); setQuery(""); }}
                                        className="mt-6 px-6 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-bold transition-all"
                                    >
                                        Reset All Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Gap */}
                    <div className="h-20" />
                </ScrollContainer>
            </main>
        </div>
    );
}

// Sub-icons for Empty State helper
function Search({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
    );
}
