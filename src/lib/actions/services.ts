"use server";

import connectToDatabase from "@/lib/db";
import Service from "@/models/Service";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Type definition for Create/Update payload
export type ServiceData = {
    title: string;
    description: string;
    skills: string[];
    jobTitles: string[];
    pricingType: "hourly" | "fixed";
    price: number;
    deliveryTime?: string;
    status: "draft" | "active" | "paused";
};

export async function createService(data: ServiceData) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    if (session.user.role !== "freelancer" && session.user.role !== "both") {
        return { error: "Only freelancers can create services" };
    }

    // Validation
    if (data.title.length > 100) return { error: "Title must be under 100 characters" };
    if (data.description.length < 50) return { error: "Description must be at least 50 characters" };
    if (!data.skills || data.skills.length === 0) return { error: "At least one skill is required" };
    if (data.jobTitles.length === 0) return { error: "At least one job title is required" };
    if (!data.price || data.price < 0) return { error: "Invalid price" };

    try {
        await connectToDatabase();

        const newService = await Service.create({
            ...data,
            createdBy: session.user.id
        });

        revalidatePath("/");
        revalidatePath("/my-services");
        revalidatePath("/browse");
        return { success: true, service: JSON.parse(JSON.stringify(newService)) };
    } catch (error) {
        console.error("Error creating service:", error);
        return { error: "Failed to create service" };
    }
}

export async function updateService(id: string, data: Partial<ServiceData>) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        // Ensure own service
        const service = await Service.findOne({ _id: id, createdBy: session.user.id });
        if (!service) return { error: "Service not found or unauthorized" };

        if (data.title && data.title.length > 100) return { error: "Title must be under 100 characters" };
        if (data.description && data.description.length < 50) return { error: "Description must be at least 50 characters" };

        const updatedService = await Service.findByIdAndUpdate(id, data, { new: true });

        revalidatePath("/");
        revalidatePath("/my-services");
        revalidatePath("/browse");
        return { success: true, service: JSON.parse(JSON.stringify(updatedService)) };
    } catch (error) {
        console.error("Error updating service:", error);
        return { error: "Failed to update service" };
    }
}

export async function deleteService(id: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();
        const res = await Service.deleteOne({ _id: id, createdBy: session.user.id });

        if (res.deletedCount === 0) return { error: "Service not found or unauthorized" };

        revalidatePath("/");
        revalidatePath("/my-services");
        revalidatePath("/browse");
        return { success: true };
    } catch (error) {
        console.error("Error deleting service:", error);
        return { error: "Failed to delete service" };
    }
}

export async function getMyServices() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();
        const services = await Service.find({ createdBy: session.user.id }).sort({ createdAt: -1 });
        return { success: true, services: JSON.parse(JSON.stringify(services)) };
    } catch (error) {
        console.error("Error fetching my services:", error);
        return { error: "Failed to fetch services" };
    }
}
