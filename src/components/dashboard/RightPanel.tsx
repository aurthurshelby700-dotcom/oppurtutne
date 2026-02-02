"use client";

import { Megaphone, Zap, ArrowRight, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchFeaturedContest } from "@/lib/actions/data";

export function RightPanel() {
    const [featuredContest, setFeaturedContest] = useState<any | null>(null);

    useEffect(() => {
        const fetchContest = async () => {
            const data = await fetchFeaturedContest();
            if (data) setFeaturedContest(data);
        };
        fetchContest();
    }, []);

    return (
        <div className="space-y-6">
            {/* Sponsored / Opportunity */}
            {featuredContest && (
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20 p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-indigo-500" />
                        <span className="text-xs font-bold text-indigo-500 uppercase">Featured Contest</span>
                    </div>
                    <h3 className="font-semibold text-sm mb-2">{featuredContest.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">${featuredContest.prize} Prize • {featuredContest.status}</p>
                    <button className="text-sm font-medium text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400">View Details &rarr;</button>
                </div>
            )}

            {/* Announcements (Static for now, could be dynamic) */}
            <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    Platform News
                </h3>
                <div className="space-y-4">
                    <div className="group cursor-pointer">
                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">New Payment Methods Added</h4>
                        <p className="text-xs text-muted-foreground mt-1">We now support direct bank transfers for 50+ countries.</p>
                    </div>
                    <div className="group cursor-pointer">
                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">Contest Mode Beta</h4>
                        <p className="text-xs text-muted-foreground mt-1">Join creative contests and win prizes this week.</p>
                    </div>
                </div>
                <button className="w-full mt-4 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                    View All <ArrowRight className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}
