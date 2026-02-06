"use client";

import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/date";
import { useRouter } from "next/navigation";
import { BookmarkButton } from "@/components/shared/BookmarkButton";
import { Briefcase } from "lucide-react";

interface ProjectCardProps {
    item: any;
}

export function ProjectCard({ item }: ProjectCardProps) {
    const router = useRouter();

    const handleNavigate = () => {
        router.push(`/project/${item._id}`);
    };

    const description = item.description || "";
    const isLongDescription = description.length > 500;
    const truncatedDescription = isLongDescription
        ? description.substring(0, 500) + "…"
        : description;

    return (
        <div
            onClick={handleNavigate}
            className="group relative bg-card p-6 rounded-2xl border border-border hover:border-project-accent/50 hover:shadow-2xl hover:shadow-project-accent/10 transition-all duration-500 cursor-pointer flex flex-col gap-4 h-auto"
        >
            {/* TOP SECTION: Icon + Content Area */}
            <div className="flex flex-row gap-5">
                {/* 1. ICON COLUMN (LEFT) - Smaller */}
                <div className="shrink-0 pt-1">
                    <div className="h-12 w-12 rounded-xl bg-project-accent/10 flex items-center justify-center border border-project-accent/20 group-hover:bg-project-accent/20 transition-colors duration-500">
                        <Briefcase className="h-5 w-5 text-project-accent" />
                    </div>
                </div>

                {/* 2. CONTENT COLUMN (RIGHT) */}
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                    {/* TOP HEADER: Title & Bookmark/Price */}
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-extrabold text-xl md:text-2xl text-foreground group-hover:text-project-accent transition-colors line-clamp-2 leading-tight tracking-tight">
                                {item.title}
                            </h3>
                            {item.jobTitles && item.jobTitles.length > 0 && (
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">
                                    {item.jobTitles[0]}
                                </p>
                            )}
                        </div>

                        {/* Right: Stacked Bookmark/Price Row & Time Below */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <div className="flex items-center gap-2">
                                <div onClick={(e) => e.stopPropagation()} className="p-0.5">
                                    <BookmarkButton
                                        itemId={item._id}
                                        itemType="project"
                                        initialSavedState={item.isSaved}
                                        activeColor="text-project-accent"
                                    />
                                </div>
                                <div className="bg-muted px-4 py-1.5 rounded-xl border border-border shadow-sm">
                                    <span className="text-base font-black text-foreground">
                                        {item.acceptedBidAmount
                                            ? `$${item.acceptedBidAmount}`
                                            : item.bidCount > 0
                                                ? `$${item.avgBid}`
                                                : "No bids yet"}
                                    </span>
                                </div>
                            </div>
                            {/* Time under Price */}
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {timeAgo(item.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div className="text-muted-foreground/80 text-sm leading-relaxed font-medium">
                        {truncatedDescription}
                        {isLongDescription && (
                            <span className="text-project-accent font-black ml-1 hover:underline underline-offset-4 cursor-pointer">
                                See more
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* FOOTER: Full-width line via negative margins */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50 -mx-6 px-6">
                <div className="flex items-center gap-2 overflow-hidden">
                    {item.skills && item.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 max-h-8 overflow-hidden">
                            {item.skills.slice(0, 3).map((skill: string) => (
                                <span key={skill} className="px-3 py-1 rounded-lg bg-secondary/50 text-secondary-foreground text-[10px] font-black uppercase tracking-tighter border border-border/50 shadow-sm whitespace-nowrap">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate();
                    }}
                    className="px-8 py-2 rounded-xl text-xs font-black bg-project-accent text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-project-accent/20 uppercase tracking-[0.15em] shrink-0"
                >
                    Bid Now
                </button>
            </div>
        </div>
    );
}
