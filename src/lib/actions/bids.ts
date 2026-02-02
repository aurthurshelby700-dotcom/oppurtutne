"use server";

import connectToDatabase from "@/lib/db";
import Bid from "@/models/Bid";
import Project from "@/models/Project";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function submitBid(data: {
    projectId: string;
    amount: number;
    days: number;
    proposal: string;
}) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    if (session.user.role !== "freelancer" && session.user.role !== "both") {
        return { error: "Only freelancers can submit proposals" };
    }

    try {
        await connectToDatabase();

        // Validate Project
        const project = await Project.findById(data.projectId);
        if (!project) {
            return { error: "Project not found" };
        }

        if (project.status !== "open") {
            return { error: "This project is closed for proposals" };
        }

        // Prevent self-bidding
        if (project.createdBy.toString() === session.user.id) {
            return { error: "You cannot bid on your own project" };
        }

        // Check if already bid
        const existingBid = await Bid.findOne({
            projectId: data.projectId,
            freelancerId: session.user.id
        });

        if (existingBid) {
            return { error: "You have already submitted a proposal for this project" };
        }

        await Bid.create({
            projectId: data.projectId,
            freelancerId: session.user.id,
            amount: data.amount,
            days: data.days,
            proposal: data.proposal
        });

        revalidatePath(`/project/${data.projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Error submitting bid:", error);
        return { error: "Failed to submit proposal" };
    }
}

export async function getProjectBids(projectId: string) {
    try {
        await connectToDatabase();
        const bids = await Bid.find({ projectId })
            .populate('freelancerId', 'name avatarUrl rating reviewsCount')
            .sort({ createdAt: -1 })
            .lean();

        return JSON.parse(JSON.stringify(bids));
    } catch (error) {
        console.error("Error fetching bids:", error);
        return [];
    }
}
