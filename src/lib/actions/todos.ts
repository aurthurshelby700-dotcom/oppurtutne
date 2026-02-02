"use server";

import connectToDatabase from "@/lib/db";
import Todo from "@/models/Todo";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getTodos() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) return [];

    await connectToDatabase();
    const todos = await Todo.find({ userId: session.user.id }).sort({ createdAt: -1 });
    // Convert to simple object to pass to client
    return JSON.parse(JSON.stringify(todos));
}

export async function addTodo(text: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) return { error: "Unauthorized" };
    if (!text.trim()) return { error: "Text required" };

    try {
        await connectToDatabase();
        const newTodo = await Todo.create({
            userId: session.user.id,
            text,
            type: "manual", // Default for user-created tasks
            completed: false
        });

        revalidatePath("/");
        return { success: true, todo: JSON.parse(JSON.stringify(newTodo)) };
    } catch (error) {
        console.error("Error adding todo:", error);
        return { error: "Failed to add todo" };
    }
}

export async function toggleTodo(id: string, currentState: boolean) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();
        await Todo.updateOne(
            { _id: id, userId: session.user.id },
            { completed: !currentState }
        );

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error toggling todo:", error);
        return { error: "Failed to toggle todo" };
    }
}

export async function deleteTodo(id: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();
        await Todo.deleteOne({ _id: id, userId: session.user.id });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error deleting todo:", error);
        return { error: "Failed to delete todo" };
    }
}
