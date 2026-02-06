"use server";

import connectToDatabase from "@/lib/db";
import Bid from "@/models/Bid";
import Project from "@/models/Project";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function submitBid(data: {
    projectId: string;
    bidAmount: number;
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

        // Enforce Email Verification
        const User = (await import("@/models/User")).default;
        const user = await User.findById(session.user.id);
        if (!user?.verification?.email) {
            return { error: "Please verify your email to submit proposals" };
        }


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

        // Validate range
        if (data.bidAmount < project.budgetMin || data.bidAmount > project.budgetMax) {
            return { error: `Bid must be between ${project.budgetMin} and ${project.budgetMax}` };
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
            bidAmount: data.bidAmount,
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
            .populate('freelancerId', 'name username avatarUrl profileImageUrl rating reviewsCount')
            .sort({ createdAt: -1 })
            .lean();

        return JSON.parse(JSON.stringify(bids));
    } catch (error) {
        console.error("Error fetching bids:", error);
        return [];
    }
}

export async function acceptBid(bidId: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        const bid = await Bid.findById(bidId);
        if (!bid) {
            return { error: "Bid not found" };
        }

        const project = await Project.findById(bid.projectId);
        if (!project) {
            return { error: "Project not found" };
        }

        // Verify client is the project owner
        if (project.createdBy.toString() !== session.user.id) {
            return { error: "Only the project owner can accept bids" };
        }

        if (project.status !== "open") {
            return { error: "This project is already closed" };
        }

        // Mark bid as accepted
        bid.status = "accepted";
        await bid.save();

        // Reject all other bids for this project
        await Bid.updateMany(
            { projectId: bid.projectId, _id: { $ne: bid._id } },
            { status: "rejected" }
        );

        // Close project
        project.status = "closed";
        await project.save();

        // Wallet Refund logic
        // We deducted budgetMax at creation. If bidAmount < budgetMax, refund difference.
        if (bid.bidAmount < project.budgetMax) {
            const refundAmount = project.budgetMax - bid.bidAmount;
            const Wallet = (await import("@/models/Wallet")).default;
            const Transaction = (await import("@/models/Transaction")).default;

            const wallet = await Wallet.findOne({ userId: session.user.id });
            if (wallet) {
                wallet.balance += refundAmount;
                await wallet.save();

                await Transaction.create({
                    walletId: wallet._id,
                    type: "credit",
                    amount: refundAmount,
                    reason: "project_refund",
                    description: `Refund for project: ${project.title} (Accepted bid lower than escrow)`,
                    relatedId: project._id,
                    createdAt: new Date()
                });
            }
        }

        // Revalidate project page and messages (since connection is unlocked)
        revalidatePath(`/project/${bid.projectId}`);
        revalidatePath("/messages");

        return { success: true };
    } catch (error) {
        console.error("Error accepting bid:", error);
        return { error: "Failed to accept bid" };
    }
}

export async function rejectBid(bidId: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        const bid = await Bid.findById(bidId);
        if (!bid) {
            return { error: "Bid not found" };
        }

        const project = await Project.findById(bid.projectId);
        if (!project) {
            return { error: "Project not found" };
        }

        // Verify client is the project owner
        if (project.createdBy.toString() !== session.user.id) {
            return { error: "Only the project owner can reject bids" };
        }

        bid.status = "rejected";
        await bid.save();

        revalidatePath(`/project/${bid.projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Error rejecting bid:", error);
        return { error: "Failed to reject bid" };
    }
}
