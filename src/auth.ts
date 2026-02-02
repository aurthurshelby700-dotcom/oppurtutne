import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                await connectToDatabase();

                const user = await User.findOne({ email: credentials.email });
                if (!user) return null;

                const passwordsMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                );

                if (passwordsMatch) {
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        role: user.role,
                        name: user.name,
                        image: user.avatarUrl,
                    };
                }
                return null;
            },
        }),
    ],
});
