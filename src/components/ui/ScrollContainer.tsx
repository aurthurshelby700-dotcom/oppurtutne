"use client";

import { useScrollAware } from "@/hooks/useScrollAware";
import { cn } from "@/lib/utils";

interface ScrollContainerProps {
    children: React.ReactNode;
    className?: string;
    innerClassName?: string;
    timeout?: number;
}

export function ScrollContainer({
    children,
    className,
    innerClassName,
    timeout = 3000
}: ScrollContainerProps) {
    const { isScrolling, onScroll } = useScrollAware(timeout);

    return (
        <div
            onScroll={onScroll}
            className={cn(
                "overflow-y-auto overflow-x-hidden custom-scrollbar",
                !isScrolling && "scrollbar-hidden",
                className
            )}
        >
            <div className={cn(innerClassName)}>
                {children}
            </div>
        </div>
    );
}
