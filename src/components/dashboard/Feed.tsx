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
    // 1. Determine Identity & Mode
    const { activeMode, user } = useUser();
    const isFreelancerMode = activeMode === "freelancer";

    // 2. State for Data
    const [services, setServices] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]); // Projects
    const [isLoading, setIsLoading] = useState(true);

    // 3. Fetch Data Logic
    // Client sees Services (Talent Marketplace)
    // Freelancer sees Projects (Job Feed)
    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (!isFreelancerMode) {
                // Client Mode -> Fetch Services
                const data = await fetchServices();
                setServices(data);
            } else {
                // Freelancer Mode -> Fetch Projects
                const data = await fetchProjectsAndContests();
                setItems(data);
            }
        } catch (error) {
            console.error("Error fetching feed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [activeMode, user]);

    // 4. Render Logic
    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // CLIENT MODE -> SHOW SERVICES
    if (!isFreelancerMode) {
        return (
            <div className="space-y-6">
                {/* Header removed - handled by parent tabs */}

                {services.length === 0 ? (
                    <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                            <Layers className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold">No services found</h3>
                        <p className="text-muted-foreground text-sm mt-2">
                            Talent is currently being onboarded. Check back soon.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 pb-4">
                        {services.map((service) => (
                            <ServiceCard key={service._id} item={service} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // FREELANCER MODE -> SHOW PROJECTS
    return (
        <div className="space-y-6">
            {/* Header removed - handled by parent tabs */}

            {items.length === 0 ? (
                <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center">
                    <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                        <Briefcase className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold">No projects available</h3>
                    <p className="text-muted-foreground text-sm mt-2">
                        Check back later for new opportunities matching your skills.
                    </p>
                </div>
            ) : (
                <div className="space-y-4 pb-4">
                    {items.map((item) => (
                        item.type === "CONTEST"
                            ? <ContestCard key={item._id} item={item} />
                            : <ProjectCard key={item._id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}
