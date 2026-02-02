"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { UserRole } from "@/types";
import { SessionProvider, useSession, signOut } from "next-auth/react";

export type ActiveMode = "freelancer" | "client";

interface Permissions {
    freelancer: boolean;
    client: boolean;
}

interface UserContextType {
    user: any | null; // Typed loosely here, but session.user has specifics
    role: UserRole | null;
    permissions: Permissions;
    activeMode: ActiveMode;
    setActiveMode: (mode: ActiveMode) => void;
    isLoading: boolean;
    isAuthenticated: boolean;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function UserContextImpl({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [activeMode, setActiveMode] = useState<ActiveMode>("freelancer");

    useEffect(() => {
        if (session?.user?.role) {
            if (session.user.role === 'freelancer') setActiveMode('freelancer');
            else if (session.user.role === 'client') setActiveMode('client');
        }
    }, [session]);

    // Derived permissions
    const permissions: Permissions = {
        freelancer: session?.user?.role === "freelancer" || session?.user?.role === "both",
        client: session?.user?.role === "client" || session?.user?.role === "both",
    };

    const value = {
        user: session?.user || null,
        role: session?.user?.role || null,
        permissions,
        activeMode,
        setActiveMode,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated",
        logout: () => signOut({ callbackUrl: "/login" }),
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function UserProvider({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <UserContextImpl>{children}</UserContextImpl>
        </SessionProvider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
