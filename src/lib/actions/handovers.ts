
"use server";

import connectToDatabase from "@/lib/db";
import ContestHandover from "@/models/ContestHandover";
import ContestAgreement from "@/models/ContestAgreement";
import Contest from "@/models/Contest";
import Entry from "@/models/Entry";
import Wallet from "@/models/Wallet";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

export async function getHandover(contestId: string) {
    try {
        await connectToDatabase();
        const handover = await ContestHandover.findOne({ contestId });
        return { success: true, handover: handover ? JSON.parse(JSON.stringify(handover)) : null };
    } catch (error) {
        console.error("Error fetching handover:", error);
        return { error: "Failed to fetch handover" };
    }
}

export async function submitHandover(contestId: string, files: Array<{ fileUrl: string }>) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();

        // Check if agreement is fully signed
        const agreement = await ContestAgreement.findOne({ contestId });
        if (!agreement || !agreement.freelancerSigned) {
            return { error: "Please sign the agreement before submitting handover" };
        }

        if (agreement.freelancerUsername !== session.user.username) {
            return { error: "Only the awarded freelancer can submit handover" };
        }

        // Create or update handover
        const filesWithTimestamp = files.map(f => ({
            fileUrl: f.fileUrl,
            format: f.fileUrl.split('.').pop()?.toLowerCase() || "unknown",
            uploadedAt: new Date()
        }));

        let handover = await ContestHandover.findOne({ contestId });
        if (handover) {
            handover.files = filesWithTimestamp;
            handover.status = "submitted";
            handover.uploadedAt = new Date();
            await handover.save();
        } else {
            handover = await ContestHandover.create({
                contestId,
                entryId: agreement.entryId,
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
                type: "contest_handover_submitted",
                message: "New handover files submitted for review",
                relatedId: contestId,
                relatedType: "contest"
            });
        }

        revalidatePath(`/contest/${contestId}`);
        return { success: true };
    } catch (error) {
        console.error("Error submitting handover:", error);
        return { error: "Failed to submit handover" };
    }
}

export async function acceptHandover(contestId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();

        const contest = await Contest.findById(contestId);
        if (!contest) return { error: "Contest not found" };

        if (contest.createdBy.toString() !== session.user.id) {
            return { error: "Only the contest owner can accept handover" };
        }

        const handover = await ContestHandover.findOne({ contestId });
        if (!handover) return { error: "Handover not found" };

        if (handover.status === "accepted") {
            return { error: "Handover already accepted" };
        }

        // Get entry to find freelancer
        const entry = await Entry.findById(handover.entryId).populate('freelancerId');
        if (!entry) return { error: "Entry not found" };

        const freelancerId = (entry.freelancerId as any)._id || entry.freelancerId;
        const freelancerUsername = (entry.freelancerId as any).username;

        // Transfer payment
        const prizeAmount = contest.prizeAmount || contest.prize || 0;

        const freelancerWallet = await Wallet.findOne({ userId: freelancerId });
        if (!freelancerWallet) return { error: "Freelancer wallet not found" };

        // Credit freelancer
        freelancerWallet.balance += prizeAmount;
        await freelancerWallet.save();

        // Create transaction for freelancer
        await Transaction.create({
            walletId: freelancerWallet._id,
            type: "credit",
            amount: prizeAmount,
            reason: "contest_post", // Using existing enum value
            description: `Won contest: ${contest.title}`,
            relatedId: contestId
        });

        // Update handover status
        handover.status = "accepted";
        handover.acceptedAt = new Date();
        await handover.save();

        // Mark contest as completed
        contest.status = "completed";
        await contest.save();

        // Notify freelancer about payment
        await createNotification({
            receiverUsername: freelancerUsername,
            type: "contest_handover_accepted",
            message: "💰 Files accepted. Payment released.",
            relatedId: contestId,
            relatedType: "contest"
        });

        // Notify freelancer they can rate the client
        const client = await User.findById(session.user.id);
        if (client) {
            await createNotification({
                receiverUsername: freelancerUsername,
                type: "rating_available",
                message: `${client.username} accepted your handover. Payment has been added to your wallet. You can now rate the client.`,
                relatedId: contestId,
                relatedType: "contest"
            });
        }

        revalidatePath(`/contest/${contestId}`);
        return { success: true };
    } catch (error) {
        console.error("Error accepting handover:", error);
        return { error: "Failed to accept handover" };
    }
}

export async function disputeHandover(contestId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();

        const contest = await Contest.findById(contestId);
        if (!contest) return { error: "Contest not found" };

        if (contest.createdBy.toString() !== session.user.id) {
            return { error: "Only the contest owner can dispute handover" };
        }

        const handover = await ContestHandover.findOne({ contestId });
        if (!handover) return { error: "Handover not found" };

        handover.status = "disputed";
        await handover.save();

        // Get entry to find freelancer
        const entry = await Entry.findById(handover.entryId).populate('freelancerId');
        if (entry) {
            const freelancerUsername = (entry.freelancerId as any).username;
            await createNotification({
                receiverUsername: freelancerUsername,
                type: "contest_handover_disputed",
                message: "Client raised a dispute on handover",
                relatedId: contestId,
                relatedType: "contest"
            });
        }

        revalidatePath(`/contest/${contestId}`);
        return { success: true };
    } catch (error) {
        console.error("Error disputing handover:", error);
        return { error: "Failed to dispute handover" };
    }
}
