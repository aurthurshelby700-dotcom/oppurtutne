"use server";

import connectToDatabase from "@/lib/db";
import Review from "@/models/Review";
import User from "@/models/User";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

interface SubmitReviewData {
    targetUserId: string;
    relatedType: "project" | "contest";
    relatedId: string;
    relatedTitle: string;
    rating: number;
    reviewText: string;
    price: number;
    reviewerRole: "client" | "freelancer";
}

export async function submitReview(data: SubmitReviewData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Unauthorized" };

        await connectToDatabase();

        // Validate
        if (data.rating < 1 || data.rating > 5) return { error: "Invalid rating" };
        if (!data.reviewText || data.reviewText.trim().length < 10) return { error: "Review text must be at least 10 characters" };

        // Create Review
        const review = await Review.create({
            ...data,
            reviewerUserId: session.user.id
        });

        // Update Target User Rating Stats
        const stats = await Review.aggregate([
            { $match: { targetUserId: review.targetUserId } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            await User.findByIdAndUpdate(data.targetUserId, {
                rating: stats[0].avgRating,
                reviewsCount: stats[0].totalReviews
            });
        }

        // Update handover rating state
        const ProjectHandover = (await import("@/models/ProjectHandover")).default;
        const ContestHandover = (await import("@/models/ContestHandover")).default;

        if (data.relatedType === "project") {
            const handover = await ProjectHandover.findOne({ projectId: data.relatedId });
            if (handover) {
                if (data.reviewerRole === "client") {
                    handover.clientHasRated = true;
                } else {
                    handover.freelancerHasRated = true;
                }
                await handover.save();
            }
        } else if (data.relatedType === "contest") {
            const handover = await ContestHandover.findOne({ contestId: data.relatedId });
            if (handover) {
                if (data.reviewerRole === "client") {
                    handover.clientHasRated = true;
                } else {
                    handover.freelancerHasRated = true;
                }
                await handover.save();
            }
        }

        // Send notification to target user
        const { createNotification } = await import("./notifications");
        const targetUser = await User.findById(data.targetUserId);
        const reviewer = await User.findById(session.user.id);

        if (targetUser && reviewer) {
            await createNotification({
                receiverUsername: targetUser.username,
                type: "review_received",
                message: `You received a new review from ${reviewer.username}`,
                relatedId: reviewer._id.toString(),
                relatedType: "user"
            });
        }

        revalidatePath(`/profile`);
        revalidatePath(`/project/${data.relatedId}`);
        revalidatePath(`/contest/${data.relatedId}`);
        return { success: true, reviewId: review._id.toString() };

    } catch (error: any) {
        console.error("Submit Review Error:", error);
        if (error.code === 11000) return { error: "You have already reviewed this item." };
        return { error: error.message };
    }
}

export async function getReviews(username: string) {
    try {
        await connectToDatabase();
        const user = await User.findOne({ username });
        if (!user) return { error: "User not found" };

        const reviews = await Review.find({ targetUserId: user._id })
            .sort({ createdAt: -1 })
            .populate("reviewerUserId", "username avatarUrl profileImageUrl firstName lastName")
            .lean();

        return { success: true, reviews: JSON.parse(JSON.stringify(reviews)) };
    } catch (error: any) {
        return { error: error.message };
    }
}
