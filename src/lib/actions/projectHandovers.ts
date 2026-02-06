"use server";

import connectToDatabase from "@/lib/db";
import mongoose from "mongoose";
import ProjectHandover from "@/models/ProjectHandover";
import ProjectAgreement from "@/models/ProjectAgreement";
import Project from "@/models/Project";
import Bid from "@/models/Bid";
import Wallet from "@/models/Wallet";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

export async function getProjectHandover(projectId: string) {
    try {
        await connectToDatabase();
        const handover = await ProjectHandover.findOne({ projectId });
        return { success: true, handover: handover ? JSON.parse(JSON.stringify(handover)) : null };
    } catch (error) {
        console.error("Error fetching project handover:", error);
        return { error: "Failed to fetch handover" };
    }
}

export async function submitProjectHandover(projectId: string, files: Array<{ fileUrl: string }>) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();

        const agreement = await ProjectAgreement.findOne({ projectId });
        if (!agreement || !agreement.clientSigned || !agreement.freelancerSigned) {
            return { error: "Agreement must be signed by both parties before handover" };
        }

        if (agreement.freelancerUsername !== session.user.username) {
            return { error: "Only the assigned freelancer can submit handover" };
        }

        const filesWithTimestamp = files.map(f => ({
            fileUrl: f.fileUrl,
            format: f.fileUrl.split('.').pop()?.toLowerCase() || "unknown",
            uploadedAt: new Date()
        }));

        let handover = await ProjectHandover.findOne({ projectId });
        if (handover) {
            handover.files = filesWithTimestamp;
            handover.status = "submitted";
            handover.uploadedAt = new Date();
            await handover.save();
        } else {
            handover = await ProjectHandover.create({
                projectId,
                freelancerUsername: session.user.username,
                files: filesWithTimestamp,
                status: "submitted",
                uploadedAt: new Date()
            });
        }

        // Notify client
        if (agreement.clientUsername) {
            await createNotification({
                receiverUsername: agreement.clientUsername,
                type: "project_bid_accepted", // Use generic for now, will refine types later
                message: "Freelancer submitted project files for review",
                relatedId: projectId,
                relatedType: "project"
            });
        }

        revalidatePath(`/project/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Error submitting project handover:", error);
        return { error: "Failed to submit handover" };
    }
}

export async function acceptProjectHandover(projectId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();

        const project = await Project.findById(projectId);
        if (!project) return { error: "Project not found" };

        if (project.createdBy.toString() !== session.user.id) {
            return { error: "Only the project owner can accept handover" };
        }

        const handover = await ProjectHandover.findOne({ projectId });
        if (!handover || handover.status === "accepted") {
            return { error: "Handover not found or already accepted" };
        }

        const agreement = await ProjectAgreement.findOne({ projectId });
        if (!agreement) return { error: "Agreement not found" };

        const bid = await (mongoose?.models?.Bid || Bid).findById(agreement.bidId);
        if (!bid) return { error: "Bid not found" };

        const freelancer = await User.findOne({ username: agreement.freelancerUsername });
        if (!freelancer) return { error: "Freelancer not found" };

        // Payment Release
        const amount = bid.bidAmount;

        // Debit Client (Escrow simulated by deducting at post, but here we fulfill the transfer)
        // Note: Project post already deducted funds from client.
        // We just need to credit freelancer.

        const freelancerWallet = await Wallet.findOne({ userId: freelancer._id });
        if (!freelancerWallet) return { error: "Freelancer wallet not found" };

        freelancerWallet.balance += amount;
        await freelancerWallet.save();

        // Transaction for freelancer
        await Transaction.create({
            walletId: freelancerWallet._id,
            type: "credit",
            amount: amount,
            reason: "project_post",
            description: `Project payment released: ${project.title}`,
            relatedId: projectId
        });

        // Update Handover
        handover.status = "accepted";
        handover.acceptedAt = new Date();
        await handover.save();

        // Update Project
        project.status = "closed"; // "completed" status was added to contest, but project model might need it too. Checking Project.ts again.
        await project.save();

        // Notify freelancer about payment
        await createNotification({
            receiverUsername: freelancer.username,
            type: "project_handover_accepted",
            message: "💰 Project completed. Payment released.",
            relatedId: projectId,
            relatedType: "project"
        });

        // Notify freelancer they can rate the client
        const client = await User.findById(session.user.id);
        if (client) {
            await createNotification({
                receiverUsername: freelancer.username,
                type: "rating_available",
                message: `${client.username} accepted your handover. Payment has been added to your wallet. You can now rate the client.`,
                relatedId: projectId,
                relatedType: "project"
            });
        }

        revalidatePath(`/project/${projectId}`);
        return {
            success: true,
            freelancerId: freelancer._id.toString(),
            freelancerUsername: freelancer.username,
            price: amount,
            projectTitle: project.title
        };
    } catch (error) {
        console.error("Error accepting project handover:", error);
        return { error: "Failed to accept handover" };
    }
}

export async function disputeProjectHandover(projectId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();
        const project = await Project.findById(projectId);
        if (!project || project.createdBy.toString() !== session.user.id) {
            return { error: "Unauthorized" };
        }

        const handover = await ProjectHandover.findOne({ projectId });
        if (!handover) return { error: "Handover not found" };

        handover.status = "disputed";
        await handover.save();

        const agreement = await ProjectAgreement.findOne({ projectId });
        if (agreement) {
            await createNotification({
                receiverUsername: agreement.freelancerUsername,
                type: "project_bid_accepted",
                message: "Client raised a dispute on project delivery",
                relatedId: projectId,
                relatedType: "project"
            });
        }

        revalidatePath(`/project/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Error disputing project handover:", error);
        return { error: "Failed to dispute handover" };
    }
}
