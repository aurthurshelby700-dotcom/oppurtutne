"use server";

import connectToDatabase from "@/lib/db";
import Entry from "@/models/Entry";
import Contest from "@/models/Contest";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function submitEntry(data: {
    contestId: string;
    files: {
        fileUrl: string;
        format: string;
    }[];
    description?: string;
}) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    if (session.user.role !== "freelancer" && session.user.role !== "both") {
        return { error: "Only freelancers can submit entries" };
    }

    try {
        await connectToDatabase();

        // Enforce Email Verification
        const User = (await import("@/models/User")).default;
        const user = await User.findById(session.user.id);
        if (!user?.verification?.email) {
            return { error: "Please verify your email to participate in contests" };
        }

        // Validate Contest
        const contest = await Contest.findById(data.contestId);
        if (!contest) {
            return { error: "Contest not found" };
        }

        if (contest.status !== "open") {
            return { error: "This contest is closed" };
        }

        // Validate formats
        const allowedFormats = (contest.deliverableFormats || []).map(f => f.toLowerCase());
        for (const file of data.files) {
            if (!allowedFormats.includes(file.format.toLowerCase())) {
                return { error: `Format .${file.format} is not allowed for this contest.` };
            }
        }

        // Prevent self-entry
        if (contest.createdBy.toString() === session.user.id) {
            return { error: "You cannot participate in your own contest" };
        }

        if (!data.files || data.files.length === 0) {
            return { error: "At least one file is required" };
        }

        const entry = await Entry.create({
            contestId: data.contestId,
            freelancerId: session.user.id,
            freelancerUsername: (session.user as any).username || "anonymous",
            files: data.files.map(f => ({
                ...f,
                uploadedAt: new Date()
            })),
            description: data.description
        });

        // Notify contest holder
        const { createNotification } = await import("./notifications");
        const clientUser = await User.findById(contest.createdBy);
        if (clientUser) {
            await createNotification({
                receiverUsername: clientUser.username,
                type: "contest_update",
                message: `New entry submitted to your contest: ${contest.title}`,
                relatedId: data.contestId,
                relatedType: "contest"
            });
        }

        revalidatePath(`/contest/${data.contestId}`);
        return { success: true };
    } catch (error) {
        console.error("Error submitting entry:", error);
        return { error: "Failed to submit entry" };
    }
}

export async function getContestEntries(contestId: string) {
    try {
        await connectToDatabase();
        const entries = await Entry.find({ contestId })
            .populate('freelancerId', 'username avatarUrl profileImageUrl')
            .sort({ createdAt: -1 })
            .lean();

        return JSON.parse(JSON.stringify(entries));
    } catch (error) {
        console.error("Error fetching entries:", error);
        return [];
    }
}

export async function rateEntry(entryId: string, rating: number) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        const entry = await Entry.findById(entryId);
        if (!entry) {
            return { error: "Entry not found" };
        }

        // Check if user is the contest owner
        const contest = await Contest.findById(entry.contestId);
        if (!contest) {
            return { error: "Contest not found" };
        }

        if (contest.createdBy.toString() !== session.user.id) {
            console.error(`Unauthorized rating attempt by ${session.user.id} on contest ${contest._id}`);
            return { error: "Only the contest owner can rate entries" };
        }

        console.log(`Updating entry ${entryId} rating to ${rating}`);
        entry.rating = rating;
        const saved = await entry.save();
        console.log(`Entry rating saved: ${saved.rating}`);

        revalidatePath(`/contest/${contest._id}`);
        return { success: true };
    } catch (error) {
        console.error("Error rating entry:", error);
        return { error: "Failed to rate entry" };
    }
}

export async function rejectEntry(entryId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();
        const entry = await Entry.findById(entryId);
        if (!entry) return { error: "Entry not found" };

        const contest = await Contest.findById(entry.contestId);
        if (!contest) return { error: "Contest not found" };

        if (contest.createdBy.toString() !== session.user.id) {
            return { error: "Only the contest owner can reject entries" };
        }

        console.log(`[SERVER] Rejecting entry ${entryId}, current status: ${entry.status}`);
        entry.status = "rejected";
        const savedEntry = await entry.save();
        console.log(`[SERVER] Entry saved with status: ${savedEntry.status}`);

        revalidatePath(`/contest/${contest._id}`);
        return { success: true };
    } catch (error) {
        console.error("Error rejecting entry:", error);
        return { error: "Failed to reject entry" };
    }
}

export async function unrejectEntry(entryId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();
        const entry = await Entry.findById(entryId);
        if (!entry) return { error: "Entry not found" };

        const contest = await Contest.findById(entry.contestId);
        if (!contest) return { error: "Contest not found" };

        if (contest.createdBy.toString() !== session.user.id) {
            return { error: "Only the contest owner can unreject entries" };
        }

        console.log(`[SERVER] Unrejecting entry ${entryId}, current status: ${entry.status}`);
        entry.status = "active";
        const savedEntry = await entry.save();
        console.log(`[SERVER] Entry saved with status: ${savedEntry.status}`);

        revalidatePath(`/contest/${contest._id}`);
        return { success: true };
    } catch (error) {
        console.error("Error unrejecting entry:", error);
        return { error: "Failed to unreject entry" };
    }
}

export async function awardEntry(contestId: string, entryId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();
        const contest = await Contest.findById(contestId);
        if (!contest) return { error: "Contest not found" };

        if (contest.createdBy.toString() !== session.user.id) {
            return { error: "Only the contest owner can award the contest" };
        }

        const entry = await Entry.findById(entryId).populate('freelancerId');
        if (!entry) return { error: "Entry not found" };

        console.log(`[SERVER] Awarding entry ${entryId}, current status: ${entry.status}`);

        // Update Entry Status
        entry.status = "awarded";
        const savedEntry = await entry.save();
        console.log(`[SERVER] Entry saved with status: ${savedEntry.status}`);

        // Update Contest Status
        contest.status = "closed";
        await contest.save();
        console.log(`[SERVER] Contest ${contestId} closed`);

        // Create Contest Agreement
        const ContestAgreement = (await import("@/models/ContestAgreement")).default;
        const freelancerUsername = (entry.freelancerId as any).username;

        await ContestAgreement.create({
            contestId,
            entryId,
            clientUsername: session.user.username || "",
            freelancerUsername,
            clientSigned: true, // Client signs immediately when awarding
            freelancerSigned: false,
            signedAtClient: new Date()
        });

        // Notify freelancer
        const { createNotification } = await import("./notifications");
        await createNotification({
            receiverUsername: freelancerUsername,
            type: "contest_update",
            message: "🎉 Your entry has been awarded",
            relatedId: contestId,
            relatedType: "contest"
        });

        revalidatePath(`/contest/${contest._id}`);
        return { success: true, showAgreementPopup: true };
    } catch (error) {
        console.error("Error awarding contest:", error);
        return { error: "Failed to award contest" };
    }
}
