"use server";

import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

import Contest from "@/models/Contest";

export async function createProject(data: {
    title: string;
    description: string;
    budget: number;
    skills: string[];
    type?: "PROJECT" | "CONTEST";
    category: string;
    deliverables?: string[];
}) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    if (session.user.role !== "client" && session.user.role !== "both") {
        return { error: "Only clients can post projects" };
    }

    try {
        await connectToDatabase();

        let newResult;

        if (data.type === 'CONTEST') {
            // Create Contest
            const newContest = await Contest.create({
                title: data.title,
                description: data.description,
                prize: data.budget, // Map budget to prize
                skills: data.skills,
                deliverables: data.deliverables || [],
                // Contest model doesn't explicitly store 'type' or 'category' in the schema shown, 
                // but we might want to if the schema allows strict typing? 
                // The schema shown in Step 1408 does NOT have 'category' or 'type'. 
                // However, we need 'category' for filtering? 
                // Let's check Contest.ts again. It does NOT have category.
                // WE SHOULD ADD CATEGORY TO CONTEST MODEL? 
                // For now, I'll rely on what's there. 
                createdBy: session.user.id,
                status: "open"
            });
            newResult = { ...newContest.toObject(), type: 'CONTEST', budget: newContest.prize };
        } else {
            // Create Project
            const newProject = await Project.create({
                title: data.title,
                description: data.description,
                budget: data.budget,
                skills: data.skills,
                type: "PROJECT",
                category: data.category,
                createdBy: session.user.id,
                status: "open"
            });
            newResult = newProject.toObject();
        }

        revalidatePath("/"); // Refresh feed
        revalidatePath("/browse"); // Refresh browse page
        revalidatePath("/my-projects"); // Refresh my projects page
        return { success: true, project: JSON.parse(JSON.stringify(newResult)) };
    } catch (error) {
        console.error("Error creating project/contest:", error);
        return { error: "Failed to create project" };
    }
}

export async function getMyProjects() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        // Fetch projects
        const projects = await Project.find({ createdBy: session.user.id })
            .sort({ createdAt: -1 })
            .lean();

        // Fetch contests
        const contests = await Contest.find({ createdBy: session.user.id })
            .sort({ createdAt: -1 })
            .lean();

        // Combine and standardize
        const combined = [
            ...projects.map(p => ({ ...p, type: 'PROJECT' })),
            ...contests.map(c => ({ ...c, type: 'CONTEST', budget: c.prize })) // Map prize to budget for UI consistency
        ];

        // Sort combined list by createdAt desc
        combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Sanitize
        const sanitizedProjects = combined.map(item => ({
            ...item,
            _id: (item as any)._id.toString(),
            createdBy: (item as any).createdBy.toString(),
            createdAt: (item as any).createdAt instanceof Date ? (item as any).createdAt.toISOString() : (item as any).createdAt,
            updatedAt: (item as any).updatedAt instanceof Date ? (item as any).updatedAt.toISOString() : (item as any).updatedAt,
        }));

        return { success: true, projects: sanitizedProjects };
    } catch (error) {
        console.error("Error fetching my projects:", error);
        return { error: "Failed to fetch projects" };
    }
}
