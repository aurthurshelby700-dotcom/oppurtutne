"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { getMyProjects } from "@/lib/actions/projects";
import { Loader2, Plus, Eye, Trash, Clock, DollarSign, Layers, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useScrollAware } from "@/hooks/useScrollAware";
import { AdPanel } from "@/components/dashboard/AdPanel";


import { ProjectFormModal } from "@/components/dashboard/ProjectFormModal";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { ContestCard } from "@/components/dashboard/ContestCard";


export default function MyProjectsPage() {
    const { activeMode, user } = useUser();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'projects' | 'contests'>('projects');


    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Scroll Awareness
    const leftPanel = useScrollAware(3000);
    const rightPanel = useScrollAware(3000);

    // Redirect if not client mode
    useEffect(() => {
        if (activeMode !== 'client') {
            router.push('/');
        }
    }, [activeMode, router]);

    const loadProjects = async () => {
        setIsLoading(true);
        try {
            const data = await getMyProjects();
            if (data.success && data.projects) {
                setProjects(data.projects);
            }
        } catch (error) {
            console.error("Failed to load projects:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) loadProjects();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const filteredItems = projects.filter(p =>
        activeTab === 'projects' ? (p.type === 'project' || !p.type) : p.type === 'contest'
    );

    return (
        <div className="h-[calc(100vh-4rem)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full">
                {/* Left Content (8 cols) */}
                <div
                    className={cn(
                        "lg:col-span-8 h-full overflow-y-auto border-r border-border bg-background scrollbar-fade",
                        leftPanel.isScrolling && "scrolling"
                    )}
                    onScroll={leftPanel.onScroll}
                >
                    <div className="p-6 space-y-6">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold">My Work</h1>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Manage your posted projects and contests.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    Post New
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-border">
                                <button
                                    onClick={() => setActiveTab('projects')}
                                    className={cn(
                                        "px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                        activeTab === 'projects'
                                            ? "border-primary text-primary"
                                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                    )}
                                >
                                    <Layers className="h-4 w-4" />
                                    Projects
                                </button>
                                <button
                                    onClick={() => setActiveTab('contests')}
                                    className={cn(
                                        "px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                        activeTab === 'contests'
                                            ? "border-amber-500 text-amber-600"
                                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                    )}
                                >
                                    <Trophy className="h-4 w-4" />
                                    Contests
                                </button>
                            </div>
                        </div>

                        {filteredItems.length === 0 ? (
                            <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
                                <div className={cn(
                                    "h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4",
                                    activeTab === 'contests' ? "bg-amber-100 text-amber-600" : "bg-muted/50 text-muted-foreground"
                                )}>
                                    {activeTab === 'contests' ? <Trophy className="h-8 w-8" /> : <Layers className="h-8 w-8" />}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No {activeTab === 'contests' ? "Contests" : "Projects"} Yet</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                    {activeTab === 'contests'
                                        ? "Crowdsource ideas by launching a contest."
                                        : "Find the perfect freelancer for your job."}
                                </p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className={cn(
                                        "font-medium hover:underline",
                                        activeTab === 'contests' ? "text-amber-600" : "text-primary"
                                    )}
                                >
                                    Post your first {activeTab === 'contests' ? "contest" : "project"} &rarr;
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredItems.map((item) => (
                                        item.type === 'contest'
                                            ? <ContestCard key={item._id} item={item} />
                                            : <ProjectCard key={item._id} item={item} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Content (Ads - 4 cols) */}
                <div
                    className={cn(
                        "lg:col-span-4 h-full overflow-y-auto p-6 border-l border-border/0 scrollbar-fade hidden lg:block",
                        rightPanel.isScrolling && "scrolling"
                    )}
                    onScroll={rightPanel.onScroll}
                >
                    <AdPanel />
                </div>
            </div>

            <ProjectFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    loadProjects();
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
}
