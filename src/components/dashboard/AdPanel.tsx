"use client";

import { Megaphone } from "lucide-react";

export function AdPanel() {
    return (
        <div className="bg-card rounded-xl border border-dashed border-border p-8 text-center h-64 flex flex-col items-center justify-center text-muted-foreground/50">
            <Megaphone className="h-8 w-8 mb-3" />
            <span className="text-sm font-medium">Advertisement Space</span>
            <span className="text-xs">Reserved for future promotions</span>
        </div>
    );
}
