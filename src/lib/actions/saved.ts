"use server";

import connectToDatabase from "@/lib/db";
import SavedItem from "@/models/SavedItem";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Import models for population
import Project from "@/models/Project";
import Contest from "@/models/Contest";
import Service from "@/models/Service";
import User from "@/models/User";
// import Course from "@/models/Course"; // If Course model exists or will exist

export async function toggleSavedItem(itemId: string, itemType: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();
        const userId = session.user.id;

        const existing = await SavedItem.findOne({
            user: userId,
            item: itemId,
            itemType: itemType
        });

        if (existing) {
            await SavedItem.findByIdAndDelete(existing._id);
            revalidatePath("/saved");
            return { saved: false };
        } else {
            await SavedItem.create({
                user: userId,
                item: itemId,
                itemType: itemType
            });
            revalidatePath("/saved");
            return { saved: true };
        }
    } catch (error) {
        console.error("Error toggling saved item:", error);
        return { error: "Failed to toggle save" };
    }
}

export async function getSavedItems(itemType: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return [];
    }

    try {
        await connectToDatabase();
        const userId = session.user.id;

        const savedDocs = await SavedItem.find({
            user: userId,
            itemType: itemType
        }).sort({ createdAt: -1 });

        if (savedDocs.length === 0) return [];

        const itemIds = savedDocs.map(doc => doc.item);

        // Populate based on type
        // This is efficient: fetch all items by ID in one go.
        let items = [];

        switch (itemType) {
            case "project":
                items = await Project.find({ _id: { $in: itemIds } }).lean();
                // Add 'type' field for card rendering consistency if needed
                items = items.map((i: any) => ({ ...i, type: 'PROJECT' }));
                break;
            case "contest":
                items = await Contest.find({ _id: { $in: itemIds } }).lean();
                items = items.map((i: any) => ({ ...i, type: 'CONTEST' }));
                break;
            case "service":
                items = await Service.find({ _id: { $in: itemIds } }).lean();
                break;
            case "freelancer":
                items = await User.find({ _id: { $in: itemIds } })
                    .select("name username title avatarUrl profileImageUrl skills rating reviewsCount location bio")
                    .lean();
                break;
            case "course":
                // items = await Course.find({ _id: { $in: itemIds } }).lean();
                // Placeholder if Course model doesn't exist yet
                items = [];
                break;
        }

        // Map back to preserve order or add savedAt date? 
        // For now, just return the items.
        // To be safe, we must return objects that look like the original items.

        // OPTIONAL: Add `isSaved: true` to them
        return items.map((item: any) => ({ ...item, isSaved: true }));

    } catch (error) {
        console.error("Error fetching saved items:", error);
        return [];
    }
}

export async function checkIsSaved(itemId: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) return false;

    try {
        await connectToDatabase();
        const exists = await SavedItem.exists({ user: session.user.id, item: itemId });
        return !!exists;
    } catch {
        return false;
    }
}
