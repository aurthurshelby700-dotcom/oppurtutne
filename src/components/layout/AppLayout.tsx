"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname?.startsWith("/onboarding");

    if (isAuthPage) {
        return <main className="w-full h-screen">{children}</main>;
    }

    return (
        <>
            <Header />
            <div className="flex flex-1 max-w-[1920px] mx-auto w-full">
                <Sidebar />
                <main className="flex-1 w-full animate-in fade-in duration-500">
                    {children}
                </main>
            </div>
        </>
    );
}
