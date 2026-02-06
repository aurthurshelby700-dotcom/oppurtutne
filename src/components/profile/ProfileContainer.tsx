"use client";

import { cn } from "@/lib/utils";
import { ScrollContainer } from "@/components/ui/ScrollContainer";

export function ProfileContainer({ children }: { children: React.ReactNode }) {
    return (
        <div className="p-2 md:p-4 h-full w-full overflow-hidden">
            <div className="bg-background border border-border rounded-xl overflow-hidden h-full flex flex-col shadow-sm">
                <ScrollContainer className="flex-1" innerClassName="w-full">
                    {children}
                </ScrollContainer>
            </div>
        </div>
    );
}
