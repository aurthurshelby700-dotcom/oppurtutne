"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { toggleSavedItem } from "@/lib/actions/saved";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
    itemId: string;
    itemType: string;
    initialSavedState?: boolean;
    className?: string;
    activeColor?: string; // e.g., "text-amber-500", "text-indigo-500"
}

export function BookmarkButton({ itemId, itemType, initialSavedState = false, className, activeColor = "text-primary" }: BookmarkButtonProps) {
    const [isSaved, setIsSaved] = useState(initialSavedState);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return;
        setIsLoading(true);

        try {
            const newState = !isSaved;
            setIsSaved(newState);
            const result = await toggleSavedItem(itemId, itemType);
            if (result.error) setIsSaved(!newState);
        } catch (error) {
            setIsSaved(!isSaved);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            className={cn(
                "p-2 rounded-full transition-all duration-200 hover:bg-muted/80 focus:outline-none",
                isSaved ? activeColor : "text-muted-foreground hover:text-foreground",
                className
            )}
            disabled={isLoading}
        >
            <Bookmark
                className={cn("h-5 w-5 transition-all duration-200", isSaved && "fill-current")}
            />
        </button>
    );
}
