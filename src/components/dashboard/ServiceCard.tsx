"use client";

import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/date";
import { useRouter } from "next/navigation";
import { BookmarkButton } from "@/components/shared/BookmarkButton";
import { Clock } from "lucide-react";

interface ServiceCardProps {
    item: any;
}

export function ServiceCard({ item }: ServiceCardProps) {
    const router = useRouter();

    const handleNavigate = () => {
        router.push(`/service/${item._id}`);
    };

    const description = item.description || "";
    const isLongDescription = description.length > 300;
    const truncatedDescription = isLongDescription
        ? description.substring(0, 300) + "..."
        : description;

    return (
        <div
            onClick={handleNavigate}
            className="group bg-card p-6 rounded-2xl border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer flex flex-col gap-5"
        >
            {/* 1. TITLE & CATEGORY */}
            <div className="space-y-1">
                <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {item.title}
                </h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {item.jobTitles?.[0] || "Professional Service"}
                </p>
            </div>

            {/* 3. DESCRIPTION */}
            <div className="text-muted-foreground text-sm leading-relaxed">
                {truncatedDescription}
                {isLongDescription && (
                    <span className="text-primary font-bold ml-1 hover:underline underline-offset-4">
                        Show more
                    </span>
                )}
            </div>

            {/* 4. PRICE ROW (Price displayed on the right, Save to the LEFT of price) */}
            <div className="flex items-center justify-end gap-3">
                <div onClick={(e) => e.stopPropagation()} className="p-1">
                    <BookmarkButton
                        itemId={item._id}
                        itemType="service"
                        initialSavedState={item.isSaved}
                        activeColor="text-primary"
                    />
                </div>
                <div className="bg-primary/5 border border-primary/10 px-4 py-1.5 rounded-full">
                    <span className="text-lg font-black text-primary">
                        ${item.price}{item.pricingType?.toLowerCase().includes("hour") ? "/hr" : ""}
                    </span>
                </div>
            </div>

            {/* 5. SKILLS ROW */}
            {item.skills && item.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 overflow-hidden max-h-8">
                    {item.skills.slice(0, 5).map((skill: string) => (
                        <span key={skill} className="px-2.5 py-1 rounded bg-muted text-[10px] font-black uppercase tracking-tighter text-muted-foreground border border-border/50">
                            {skill}
                        </span>
                    ))}
                    {item.skills.length > 5 && (
                        <span className="text-[10px] font-bold text-muted-foreground/50 self-center">
                            +{item.skills.length - 5}
                        </span>
                    )}
                </div>
            )}

            {/* 6. FOOTER ROW */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{item.createdAt ? timeAgo(item.createdAt) : `Delivery: ${item.deliveryTime || 'few days'}`}</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate();
                    }}
                    className="px-6 py-2.5 rounded-xl text-xs font-black bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest"
                >
                    View Service
                </button>
            </div>
        </div>
    );
}
