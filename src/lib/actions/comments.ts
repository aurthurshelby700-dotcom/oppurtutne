"use server";

import connectToDatabase from "@/lib/db";
import EntryComment from "@/models/EntryComment";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function postEntryComment(entryId: string, content: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    if (!content.trim()) {
        return { error: "Comment cannot be empty" };
    }

    try {
        await connectToDatabase();

        const newComment = await EntryComment.create({
            entryId,
            authorId: session.user.id,
            content: content.trim(),
        });

        // Revalidate to show new comment immediately
        // Note: The specific path might need adjustment depending on where this is called
        // Since it's in a modal on a dynamic route, usually revalidating the page is redundant 
        // if we use a client-side fetch update, but good for consistency.

        return JSON.parse(JSON.stringify(newComment));
    } catch (error) {
        console.error("Error posting comment:", error);
        return { error: "Failed to post comment" };
    }
}

export async function getEntryComments(entryId: string) {
    try {
        await connectToDatabase();
        const comments = await EntryComment.find({ entryId })
            .populate("authorId", "name avatarUrl")
            .sort({ createdAt: 1 }) // Chronological order
            .lean();

        return JSON.parse(JSON.stringify(comments));
    } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
    }
}
