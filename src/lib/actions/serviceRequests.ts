"use server";

import connectToDatabase from "@/lib/db";
import ServiceRequest from "@/models/ServiceRequest";
import Service from "@/models/Service";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

export async function requestService(data: {
    serviceId: string;
    message: string;
}) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        // Enforce Email Verification
        const UserModel = (await import("@/models/User")).default;
        const user = await UserModel.findById(session.user.id);
        if (!user?.verification?.email) {
            return { error: "Please verify your email to request services" };
        }


        const service = await Service.findById(data.serviceId);
        if (!service) {
            return { error: "Service not found" };
        }

        // Prevent self-requesting
        if (service.createdBy.toString() === session.user.id) {
            return { error: "You cannot request your own service" };
        }

        // Check for existing request
        const existingRequest = await ServiceRequest.findOne({
            serviceId: data.serviceId,
            clientId: session.user.id,
            status: "pending",
        });

        if (existingRequest) {
            return { error: "You already have a pending request for this service" };
        }

        await ServiceRequest.create({
            serviceId: data.serviceId,
            clientId: session.user.id,
            freelancerId: service.createdBy,
            message: data.message,
        });

        revalidatePath(`/service/${data.serviceId}`);
        return { success: true };
    } catch (error) {
        console.error("Error requesting service:", error);
        return { error: "Failed to send service request" };
    }
}

export async function respondToServiceRequest(requestId: string, status: "accepted" | "rejected") {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        const request = await ServiceRequest.findById(requestId);
        if (!request) {
            return { error: "Request not found" };
        }

        // Verify user is the freelancer
        if (request.freelancerId.toString() !== session.user.id) {
            return { error: "Only the service provider can respond to requests" };
        }

        request.status = status;
        await request.save();

        revalidatePath("/messages"); // Since accept unlocks messaging
        return { success: true };
    } catch (error) {
        console.error(`Error ${status} service request:`, error);
        return { error: `Failed to ${status} service request` };
    }
}

export async function getServiceRequests() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        // Get requests where user is either client or freelancer
        const requests = await ServiceRequest.find({
            $or: [{ clientId: session.user.id }, { freelancerId: session.user.id }],
        })
            .populate("serviceId", "title")
            .populate("clientId", "username firstName lastName avatarUrl profileImageUrl")
            .populate("freelancerId", "username firstName lastName avatarUrl profileImageUrl")
            .sort({ createdAt: -1 })
            .lean();

        return JSON.parse(JSON.stringify(requests));
    } catch (error) {
        console.error("Error fetching service requests:", error);
        return [];
    }
}
