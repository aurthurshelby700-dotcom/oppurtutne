"use server";

import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";

export async function registerUser(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Explicitly set role to pending
    const role = "pending";

    if (!email || !password) {
        return { error: "Missing fields" };
    }

    try {
        await connectToDatabase();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return { error: "User already exists" };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            email,
            passwordHash: hashedPassword,
            role,
        });

        // After registration, try to sign in
        try {
            await signIn("credentials", {
                email,
                password,
                redirect: false,
            });
        } catch (err) {
            // Ignore redirect error
        }

        return { success: true };

    } catch (error: any) {
        console.error("Registration error:", error);
        return { error: error.message || "Registration failed" };
    }
}

export async function loginUser(prevState: string | undefined, formData: FormData) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function updateUserRole(role: "freelancer" | "client" | "both") {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    if (session.user.role !== "pending") {
        return { error: "Role already set" };
    }

    try {
        await connectToDatabase();
        await User.findByIdAndUpdate(session.user.id, { role });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error updating role:", error);
        return { error: "Failed to update role" };
    }
}
