"use client";

import { cn } from "@/lib/utils";
import { Zap, Clock, Trophy } from "lucide-react";
import { timeAgo } from "@/lib/date";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { BookmarkButton } from "@/components/shared/BookmarkButton";

interface MyContestCardProps {
    item: any;
}

export function MyContestCard({ item }: MyContestCardProps) {
    const router = useRouter();

    const handleClick = () => {
        router.push(`/contest/${item._id}`);
    };

    const description = item.description || "";
    const isTruncated = description.length > 250;
    const displayDescription = isTruncated ? description.substring(0, 250) + "..." : description;

    return (
        <div
            onClick={handleClick}
            className="group relative bg-amber-500/5 p-5 rounded-xl border border-amber-500/30 hover:border-amber-500 transition-all cursor-pointer flex flex-col"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(item.createdAt)}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-foreground bg-background px-4 py-1.5 rounded-full border border-border shadow-sm">
                        ${item.prize}
                    </span>
                </div>
            </div>

            <div className="pl-[4rem] mb-4 flex-grow">
                <p className="text-sm text-muted-foreground">
                    {displayDescription}{" "}
                    {isTruncated && (
                        <Link
                            href={`/contest/${item._id}`}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                            className="text-primary font-medium hover:underline ml-1"
                        >
                            Show more
                        </Link>
                    )}
                </p>
            </div>

            <div className="pl-[4rem] flex flex-wrap items-center justify-between gap-4 mt-auto">
                <div className="flex flex-wrap gap-2">
                    {item.skills?.map((skill: string) => (
                        <span key={skill} className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                            {skill}
                        </span>
                    ))}
                </div>

                <button className="px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap bg-amber-500 text-white hover:bg-amber-600">
                    View Details
                </button>
            </div>
        </div>
    );
}
