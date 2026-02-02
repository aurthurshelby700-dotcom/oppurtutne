import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's role. */
            role: "freelancer" | "client" | "both" | "pending";
            id: string;
        } & DefaultSession["user"]
    }

    interface User {
        role: "freelancer" | "client" | "both" | "pending";
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: "freelancer" | "client" | "both" | "pending";
        id: string;
    }
}
