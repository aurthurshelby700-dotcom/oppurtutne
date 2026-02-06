"use server";

import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

import Contest from "@/models/Contest";
import Wallet from "@/models/Wallet";
import Transaction from "@/models/Transaction";

export async function createProject(data: {
    title: string;
    description: string;
    budgetMin: number;
    budgetMax: number;
    skills: string[];
    jobTitles: string[];
    type?: "project" | "contest";
    deliverables?: string[];
    deliverableFormats?: string[];
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

        // Check Wallet Balance
        const wallet = await Wallet.findOne({ userId: session.user.id });
        if (!wallet) {
            return { error: "Wallet not found. Please contact support." };
        }

        console.log("createProject data:", JSON.stringify(data, null, 2));

        const projectBudget = data.type === 'contest' ? data.budgetMax : data.budgetMax; // Use Max for escrow

        if (isNaN(projectBudget)) {
            console.error("Project Error: Budget is NaN", { projectBudget, data });
            return { error: "Invalid budget amount (NaN)" };
        }

        if (wallet.balance < projectBudget) {
            return { error: `Insufficient funds. Your balance is $${wallet.balance}, but required is $${projectBudget}. Please add funds.` };
        }

        // Deduct Funds
        wallet.balance -= projectBudget;
        await wallet.save();

        // Create Transaction
        await Transaction.create({
            walletId: wallet._id,
            type: "debit",
            amount: projectBudget,
            reason: data.type === 'contest' ? "contest_post" : "project_post",
            description: `Posted ${data.type === 'contest' ? 'Contest' : 'Project'}: ${data.title}`,
            createdAt: new Date()
        });

        let newResult;

        if (data.type === 'contest') {
            // Create Contest
            const newContest = await Contest.create({
                title: data.title,
                description: data.description,
                prizeAmount: data.budgetMax,
                prize: data.budgetMax, // Backward compatibility
                jobTitles: data.jobTitles || [],
                skills: data.skills,
                deliverableFormats: data.deliverableFormats || [],
                createdBy: session.user.id,
                clientId: session.user.id,
                clientUsername: (session.user as any).username,
                status: "open",
                type: "contest"
            });
            newResult = { ...newContest.toObject(), type: 'contest', budget: newContest.prizeAmount };

            // Update transaction with relatedId
            await Transaction.updateOne(
                { description: `Posted Contest: ${data.title}`, walletId: wallet._id }, // rudimentary match, better if we hold the txn reference
                { relatedId: newContest._id }
            );
        } else {
            // Create Project
            const newProject = await Project.create({
                title: data.title,
                description: data.description,
                budgetMin: data.budgetMin,
                budgetMax: data.budgetMax,
                jobTitles: data.jobTitles || [],
                skills: data.skills,
                type: "project",
                createdBy: session.user.id,
                clientId: session.user.id,
                clientUsername: (session.user as any).username,
                status: "open"
            });
            newResult = newProject.toObject();

            // Update transaction with relatedId
            await Transaction.updateOne(
                { description: `Posted Project: ${data.title}`, walletId: wallet._id },
                { relatedId: newProject._id }
            );
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
        const ownershipQuery = {
            $or: [
                { clientId: session.user.id },
                { clientUsername: (session.user as any).username },
                { createdBy: session.user.id } // Backward compatibility
            ]
        };

        const projects = await Project.find({ ...ownershipQuery, type: "project" })
            .sort({ createdAt: -1 })
            .lean();

        const contests = await Contest.find(ownershipQuery) // Contest model might not have type "contest" explicitly if it's the only one, but standardizing
            .sort({ createdAt: -1 })
            .lean();

        // Combine and standardize
        const combined = [
            ...projects.map(p => ({ ...p, type: 'project' })),
            ...contests.map(c => ({ ...c, type: 'contest', budget: c.prizeAmount || c.prize })) // Map prizeAmount to budget for UI consistency
        ];

        // Sort combined list by createdAt desc
        combined.sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());

        // Sanitize and Add Bid Stats
        const Bid = (await import("@/models/Bid")).default;
        const sanitizedProjects = await Promise.all(combined.map(async (item: any) => {
            let itemData = {
                ...item,
                _id: (item as any)._id.toString(),
                createdBy: (item as any).createdBy.toString(),
                createdAt: (item as any).createdAt instanceof Date ? (item as any).createdAt.toISOString() : (item as any).createdAt,
                updatedAt: (item as any).updatedAt instanceof Date ? (item as any).updatedAt.toISOString() : (item as any).updatedAt,
            };

            if (item.type === 'project') {
                const bids = await Bid.find({ projectId: item._id }).lean();
                const acceptedBid = bids.find((b: any) => b.status === 'accepted');

                let avgBid = 0;
                if (bids.length > 0) {
                    const sum = bids.reduce((acc: number, b: any) => acc + (b.bidAmount || 0), 0);
                    avgBid = Math.round(sum / bids.length);
                }

                itemData.avgBid = avgBid;
                itemData.bidCount = bids.length;
                itemData.acceptedBidAmount = acceptedBid?.bidAmount;
            }

            return itemData;
        }));

        return { success: true, projects: sanitizedProjects };
    } catch (error) {
        console.error("Error fetching my projects:", error);
        return { error: "Failed to fetch projects" };
    }
}
