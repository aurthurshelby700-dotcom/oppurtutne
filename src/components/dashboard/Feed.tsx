"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Briefcase, Layers, Zap, Clock, Plus, Loader2 } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { fetchServices, fetchProjectsAndContests } from "@/lib/actions/data";
import { timeAgo } from "@/lib/date";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { ContestCard } from "@/components/dashboard/ContestCard";
import { ServiceCard } from "@/components/dashboard/ServiceCard";
import { BookmarkButton } from "@/components/shared/BookmarkButton";

export function Feed() {
    const { activeMode, user } = useUser();
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // New API endpoint handles logic based on mode
            const res = await fetch(`/api/home/recommended?mode=${activeMode}`);
            const data = await res.json();

            if (data.items) {
                setItems(data.items);
            }
        } catch (error) {
            console.error("Error fetching recommended feed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [activeMode, user]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center">
                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                    <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">No recommendations found</h3>
                <p className="text-muted-foreground text-sm mt-2">
                    Check back later for new opportunities matching your profile.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4 pb-4">
                {items.map((item) => {
                    if (item.type === 'service') {
                        return <ServiceCard key={item._id} item={item} />;
                    } else if (item.type === 'contest') {
                        return <ContestCard key={item._id} item={item} />;
                    } else {
                        // Default to Project
                        return <ProjectCard key={item._id} item={item} />;
                    }
                })}
            </div>
        </div>
    );
}
