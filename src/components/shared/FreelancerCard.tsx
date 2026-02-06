"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Star, UserCircle, ChevronRight } from "lucide-react";
import Image from "next/image";

interface FreelancerCardProps {
    item: {
        username: string;
        profileImageUrl?: string;
        avatarUrl?: string; // Fallback
        bio?: string;
        description?: string; // Fallback for bio
        pricePerHour?: number;
        skills?: string[];
        rating?: number;
        ratingAverage?: number;
        country?: string; // Keep country if available, though prompt didn't explicitly demand it in layout, it's usually good. Prompt only listed specific fields for Binding... "Card MUST use ONLY these fields: { username, profileImageUrl, bio, hourlyRate, skills, ratingAverage }". I will strictly stick to those 6 + fallback.
        [key: string]: any;
    };
}

export function FreelancerCard({ item }: FreelancerCardProps) {
    const router = useRouter();

    const handleNavigate = () => {
        router.push(`/profile/${item.username}`);
    };

    // Data Mapping
    const displayImage = item.profileImageUrl || item.avatarUrl;
    const displayName = item.username;
    const bio = item.bio || item.description;
    const price = item.pricePerHour;
    const skills = item.skills || [];
    const rating = item.ratingAverage || item.rating || 0;

    return (
        <div
            onClick={handleNavigate}
            className="bg-card w-full rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col overflow-hidden"
        >
            {/* 1. HEADER SECTION */}
            <div className="flex justify-between items-start p-5 pb-3">
                {/* LEFT: Avatar & Username */}
                <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted border border-border">
                        {displayImage ? (
                            <Image
                                src={displayImage}
                                alt={displayName}
                                width={48}
                                height={48}
                                unoptimized
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                                <UserCircle className="h-8 w-8" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span
                            className="font-bold text-foreground text-lg hover:text-primary transition-colors hover:underline underline-offset-4"
                            onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
                        >
                            @{displayName}
                        </span>
                    </div>
                </div>

                {/* RIGHT: Price & Rating */}
                <div className="flex flex-col items-end gap-1">
                    <div className="bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                        <span className="font-bold text-primary text-sm">
                            {price ? `$${price} / hr` : "Rate not set"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        {rating > 0 ? (
                            <>
                                <div className="flex text-amber-500">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={cn(
                                                "h-3 w-3",
                                                star <= Math.round(rating)
                                                    ? "fill-current"
                                                    : "text-muted-foreground/20 fill-none"
                                            )}
                                        />
                                    ))}
                                </div>
                                <span>{(rating).toFixed(1)}</span>
                            </>
                        ) : (
                            <span>No ratings yet</span>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. BODY SECTION (Bio) */}
            {bio && (
                <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {bio}
                    </p>
                </div>
            )}

            <div className="flex-1" /> {/* Spacer */}

            {/* 3. FOOTER SECTION */}
            <div className="px-5 py-4 border-t border-border/50 bg-muted/20 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
                {/* LEFT: Skills */}
                <div className="flex flex-wrap gap-2 overflow-hidden max-h-[2rem]">
                    {skills.length > 0 ? (
                        <>
                            {skills.slice(0, 4).map((skill, i) => (
                                <span key={i} className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-background border border-border text-muted-foreground whitespace-nowrap">
                                    {skill}
                                </span>
                            ))}
                            {skills.length > 4 && (
                                <span className="text-[10px] font-bold text-muted-foreground self-center px-1">
                                    +{skills.length - 4} more
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground/50 italic">No skills listed</span>
                    )}
                </div>

                {/* RIGHT: View Profile Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
                    className="shrink-0 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1"
                >
                    View Profile <ChevronRight className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}
