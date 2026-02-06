
"use server";

import connectToDatabase from "@/lib/db";
import ContestAgreement from "@/models/ContestAgreement";
import Contest from "@/models/Contest";
import Entry from "@/models/Entry";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

export async function getAgreement(contestId: string) {
    try {
        await connectToDatabase();
        const agreement = await ContestAgreement.findOne({ contestId });
        return { success: true, agreement: agreement ? JSON.parse(JSON.stringify(agreement)) : null };
    } catch (error) {
        console.error("Error fetching agreement:", error);
        return { error: "Failed to fetch agreement" };
    }
}

export async function signAgreementAsClient(contestId: string, entryId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();

        const contest = await Contest.findById(contestId);
        if (!contest) return { error: "Contest not found" };

        if (contest.createdBy.toString() !== session.user.id) {
            return { error: "Only the contest owner can sign as client" };
        }

        const agreement = await ContestAgreement.findOne({ contestId });
        if (!agreement) return { error: "Agreement not found" };

        agreement.clientSigned = true;
        agreement.signedAtClient = new Date();
        await agreement.save();

        // Notify freelancer
        const entry = await Entry.findById(entryId).populate('freelancerId');
        if (entry && entry.freelancerId) {
            await createNotification({
                receiverUsername: (entry.freelancerId as any).username,
                type: "contest_update",
                message: "Contest holder signed the agreement. Please sign to proceed.",
                relatedId: contestId,
                relatedType: "contest"
            });
        }

        revalidatePath(`/contest/${contestId}`);
        return { success: true };
    } catch (error) {
        console.error("Error signing agreement as client:", error);
        return { error: "Failed to sign agreement" };
    }
}

export async function signAgreementAsFreelancer(contestId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();

        const agreement = await ContestAgreement.findOne({ contestId });
        if (!agreement) return { error: "Agreement not found" };

        if (agreement.freelancerUsername !== session.user.username) {
            return { error: "Only the awarded freelancer can sign" };
        }

        agreement.freelancerSigned = true;
        agreement.signedAtFreelancer = new Date();
        await agreement.save();

        // Notify client (optional, they'll see the status change)
        const contest = await Contest.findById(contestId).populate('createdBy');
        if (contest && contest.createdBy) {
            await createNotification({
                receiverUsername: (contest.createdBy as any).username,
                type: "contest_update",
                message: "Freelancer signed the agreement. Awaiting handover.",
                relatedId: contestId,
                relatedType: "contest"
            });
        }

        revalidatePath(`/contest/${contestId}`);
        return { success: true };
    } catch (error) {
        console.error("Error signing agreement as freelancer:", error);
        return { error: "Failed to sign agreement" };
    }
}
