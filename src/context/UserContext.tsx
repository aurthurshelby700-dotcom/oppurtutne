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
    refreshUser: () => Promise<void>;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function UserContextImpl({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [activeMode, setActiveMode] = useState<ActiveMode>("freelancer");
    const [extendedUser, setExtendedUser] = useState<any>(null);

    useEffect(() => {
        if (session?.user?.role) {
            if (session.user.role === 'freelancer') setActiveMode('freelancer');
            else if (session.user.role === 'client') setActiveMode('client');
        }

        // Fetch DB data whenever session changes to ensure we have latest fields (like verification)
        if (session?.user) {
            import("@/lib/actions/user").then(({ fetchUserProfile }) => {
                fetchUserProfile().then((profile) => {
                    if (profile && !('error' in profile)) {
                        setExtendedUser(profile);
                    }
                });
            });
        } else {
            setExtendedUser(null);
        }
    }, [session]);

    // Derived permissions
    const permissions: Permissions = {
        freelancer: session?.user?.role === "freelancer" || session?.user?.role === "both",
        client: session?.user?.role === "client" || session?.user?.role === "both",
    };

    // Merge session user with extended user data (DB data takes precedence for missing fields)
    const combinedUser = session?.user ? {
        ...session.user,
        ...(extendedUser || {})
    } : null;

    const refreshUser = async () => {
        const { fetchUserProfile } = await import("@/lib/actions/user");
        const profile = await fetchUserProfile();
        if (profile && !('error' in profile)) {
            setExtendedUser(profile);
        }
    };

    const value = {
        user: combinedUser,
        role: session?.user?.role || null,
        permissions,
        activeMode,
        setActiveMode,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated",
        refreshUser,
        logout: async () => {
            await signOut({ callbackUrl: "/login", redirect: true });
        },
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
