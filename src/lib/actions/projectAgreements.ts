"use server";

import connectToDatabase from "@/lib/db";
import ProjectAgreement from "@/models/ProjectAgreement";
import Project from "@/models/Project";
import Bid from "@/models/Bid";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

export async function getProjectAgreement(projectId: string) {
    try {
        await connectToDatabase();
        const agreement = await ProjectAgreement.findOne({ projectId });
        return { success: true, agreement: agreement ? JSON.parse(JSON.stringify(agreement)) : null };
    } catch (error) {
        console.error("Error fetching project agreement:", error);
        return { error: "Failed to fetch agreement" };
    }
}

export async function signProjectAgreementAsClient(projectId: string, bidId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();
        const project = await Project.findById(projectId);
        if (!project) return { error: "Project not found" };

        if (project.createdBy.toString() !== session.user.id) {
            return { error: "Only the project owner can sign the agreement" };
        }

        const bid = await Bid.findById(bidId).populate('freelancerId');
        if (!bid) return { error: "Bid not found" };

        let agreement = await ProjectAgreement.findOne({ projectId });

        if (!agreement) {
            agreement = await ProjectAgreement.create({
                projectId,
                bidId,
                clientUsername: session.user.username,
                freelancerUsername: (bid.freelancerId as any).username,
                clientSigned: true,
                signedAtClient: new Date()
            });
        } else {
            agreement.clientSigned = true;
            agreement.signedAtClient = new Date();
            await agreement.save();
        }

        // Notify freelancer
        await createNotification({
            receiverUsername: agreement.freelancerUsername,
            type: "project_bid_accepted", // Reusing for consistency, but with specific message
            message: "Project agreement ready for signing",
            relatedId: projectId,
            relatedType: "project"
        });

        revalidatePath(`/project/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Error signing agreement as client:", error);
        return { error: "Failed to sign agreement" };
    }
}

export async function signProjectAgreementAsFreelancer(projectId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();
        const agreement = await ProjectAgreement.findOne({ projectId });
        if (!agreement) return { error: "Agreement not found" };

        if (agreement.freelancerUsername !== session.user.username) {
            return { error: "Unauthorized" };
        }

        agreement.freelancerSigned = true;
        agreement.signedAtFreelancer = new Date();
        await agreement.save();

        // Notify client
        await createNotification({
            receiverUsername: agreement.clientUsername,
            type: "project_bid_accepted",
            message: "Freelancer has signed the project agreement",
            relatedId: projectId,
            relatedType: "project"
        });

        revalidatePath(`/project/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Error signing agreement as freelancer:", error);
        return { error: "Failed to sign agreement" };
    }
}
