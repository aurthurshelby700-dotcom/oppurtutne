import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const role = auth?.user?.role;

            const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/signup");
            const isOnboardingPage = nextUrl.pathname.startsWith("/onboarding");
            const isProtectedPath = ['/home', '/projects', '/services', '/contests', '/profile'].some(path => nextUrl.pathname.startsWith(path));
            const isRoot = nextUrl.pathname === "/";

            // Pending User Logic:
            // If logged in and role is pending -> FORCE redirect to /onboarding (unless already there)
            if (isLoggedIn && role === "pending") {
                if (!isOnboardingPage) {
                    return Response.redirect(new URL("/onboarding", nextUrl));
                }
                return true; // Allow access to onboarding
            }

            // If logged in and role is NOT pending -> FORCE redirect away from role selection
            // But ALLOW /onboarding/profile - Redirect to profile setup instead of home if they hit /onboarding
            if (isLoggedIn && role !== "pending" && nextUrl.pathname === "/onboarding") {
                return Response.redirect(new URL("/onboarding/profile", nextUrl));
            }

            // Standard Protection
            if (isOnboardingPage && !isLoggedIn) return false; // Protect onboarding

            if (isProtectedPath || isRoot) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }

            if (isAuthPage) {
                if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
                return true;
            }

            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.name = user.name;
                token.username = (user as any).username;
                token.picture = user.image;
                token.profileImageUrl = (user as any).profileImageUrl;
                token.verification = (user as any).verification;
            }
            // Update token if session update is triggered (e.g. after role or profile update)
            if (trigger === "update" && session) {
                if (session.role) token.role = session.role;
                if (session.name) token.name = session.name;
                if (session.username) token.username = session.username;
                if (session.image) token.picture = session.image;
                if (session.profileImageUrl) token.profileImageUrl = session.profileImageUrl;
                if (session.verification) token.verification = session.verification;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as any;
                session.user.name = token.name;
                (session.user as any).username = token.username;
                session.user.image = token.picture;
                (session.user as any).profileImageUrl = token.profileImageUrl;
                (session.user as any).verification = token.verification;
            }
            return session;
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
