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
            username: string;
            verification?: {
                email: boolean;
                mobile: boolean;
                identity: boolean;
                payment: boolean;
            };
        } & DefaultSession["user"]
    }

    interface User {
        role: "freelancer" | "client" | "both" | "pending";
        username: string;
        verification?: {
            email: boolean;
            mobile: boolean;
            identity: boolean;
            payment: boolean;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: "freelancer" | "client" | "both" | "pending";
        id: string;
        username: string;
        verification?: {
            email: boolean;
            mobile: boolean;
            identity: boolean;
            payment: boolean;
        };
    }
}
