"use client";

import { useUser } from "@/context/UserContext";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrowseHeaderProps {
    type: string;
    setType: (type: string) => void;
    query: string;
    setQuery: (query: string) => void;
}

export function BrowseHeader({ type, setType, query, setQuery }: BrowseHeaderProps) {
    const { activeMode } = useUser();

    const types = [
        { id: "projects", label: "Projects" },
        { id: "contests", label: "Contests" },
        { id: "services", label: "Services" },
        { id: "freelancers", label: "Freelancers" },
        { id: "courses", label: "Courses" },
    ];

    const getPlaceholder = () => {
        switch (type) {
            case "projects": return "Search projects by title or skills...";
            case "contests": return "Search active contests...";
            case "services": return "Find services you need...";
            case "freelancers": return "Search freelancers by name, title or skill...";
            case "courses": return "Find courses to learn...";
            default: return "Search...";
        }
    };

    return (
        <div className="flex flex-col gap-4 bg-background pb-6 sticky top-0 z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative flex-1 max-w-2xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={getPlaceholder()}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card hover:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>

                {/* Type Switcher */}
                <div className="flex bg-muted/50 p-1 rounded-xl border border-border shrink-0 self-start lg:self-center">
                    {types.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setType(t.id)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                type === t.id
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
