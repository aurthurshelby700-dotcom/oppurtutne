"use server";

import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/auth";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

export async function fetchUserProfile() {
    noStore();
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();
        // Use lean() for better performance as we just need JSON
        const user = await User.findById(session.user.id).lean();

        if (!user) {
            return { error: "User not found" };
        }

        // Convert _id to string/id and flatten structure
        return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            username: user.username,
            name: `${user.firstName} ${user.lastName}`,
            bio: user.bio || "",
            jobTitles: user.jobTitles || [],
            skills: user.skills || [],
            location: user.location || "",
            avatar_url: user.avatarUrl || "",
            cover_url: user.coverUrl || "",
            profileImageUrl: user.profileImageUrl || null,
            bannerImageUrl: user.bannerImageUrl || null,
            emailVerified: user.emailVerified || false,
            created_at: user.createdAt.toISOString(),
            verification: user.verification || {
                email: false,
                mobile: false,
                identity: false,
                payment: false
            }
        };
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return { error: "Failed to fetch profile" };
    }
}

export async function updateUserProfile(data: {
    name?: string;
    jobTitles?: string[];
    bio?: string;
    skills?: string[];
    location?: string;
    avatar_url?: string;
    cover_url?: string;
    profileImageUrl?: string | null;
    bannerImageUrl?: string | null;
}) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        console.log("Updating user profile for:", session.user.id, data);

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.jobTitles !== undefined) updateData.jobTitles = data.jobTitles;
        if (data.bio !== undefined) updateData.bio = data.bio;
        if (data.skills !== undefined) updateData.skills = data.skills;
        if (data.location !== undefined) updateData.location = data.location;
        if (data.avatar_url !== undefined) updateData.avatarUrl = data.avatar_url;
        if (data.cover_url !== undefined) updateData.coverUrl = data.cover_url;
        if (data.profileImageUrl !== undefined) updateData.profileImageUrl = data.profileImageUrl;
        if (data.bannerImageUrl !== undefined) updateData.bannerImageUrl = data.bannerImageUrl;

        const res = await User.findByIdAndUpdate(
            session.user.id,
            { $set: updateData },
            { new: true } // Return updated doc
        );
        console.log("Update result:", res ? "Success" : "User not found");

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error("Error updating user profile:", error);
        return { error: "Failed to update profile" };
    }
}

export async function getPublicUserProfile(userId: string) {
    try {
        await connectToDatabase();
        const user = await User.findById(userId).lean();

        if (!user) return null;

        return {
            id: user._id.toString(),
            name: user.name || "",
            bio: user.bio || "",
            jobTitles: user.jobTitles || [],
            skills: user.skills || [],
            location: user.location || "",
            avatar_url: user.avatarUrl || "",
            cover_url: user.coverUrl || "",
            profileImageUrl: user.profileImageUrl || null,
            bannerImageUrl: user.bannerImageUrl || null,
            created_at: user.createdAt.toISOString(),
            // Exclude sensitive fields like email
        };
    } catch (error) {
        console.error("Error fetching public profile:", error);
        return null;
    }
}
