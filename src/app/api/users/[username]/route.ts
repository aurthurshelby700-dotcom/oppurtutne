
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ username: string }> }
) {
    const params = await props.params;
    try {
        await connectToDatabase();
        const username = params.username.toLowerCase();

        const user = await User.findOne({ username })
            .select("-passwordHash -verificationToken"); // Exclude sensitive fields

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ username: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const username = params.username.toLowerCase();

        // Verify the authenticated user owns this profile
        // We need to fetch the user by email (from session) and check if their username matches
        const currentUser = await User.findOne({ email: session.user.email });

        if (!currentUser || currentUser.username !== username) {
            return NextResponse.json({ error: "Forbidden: You can only edit your own profile" }, { status: 403 });
        }

        const body = await req.json();

        // Allowed updates
        // Build partial update object
        const updateData: any = {};

        if (body.firstName !== undefined) updateData.firstName = body.firstName;
        if (body.lastName !== undefined) updateData.lastName = body.lastName;

        // Handle jobTitles array directly
        if (body.jobTitles !== undefined) {
            updateData.jobTitles = body.jobTitles;
        }

        if (body.bio !== undefined) updateData.bio = body.bio;
        if (body.pricePerHour !== undefined) updateData.pricePerHour = body.pricePerHour;
        if (body.skills !== undefined) updateData.skills = body.skills;
        if (body.country !== undefined) { updateData.country = body.country; updateData.location = body.country; }
        if (body.mobileNumber !== undefined) updateData.mobileNumber = body.mobileNumber;
        if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
        if (body.coverUrl !== undefined) updateData.coverUrl = body.coverUrl;
        if (body.profileImageUrl !== undefined) updateData.profileImageUrl = body.profileImageUrl;
        if (body.bannerImageUrl !== undefined) updateData.bannerImageUrl = body.bannerImageUrl;
        if (body.portfolio !== undefined) updateData.portfolio = body.portfolio;

        const updatedUser = await User.findByIdAndUpdate(
            currentUser._id,
            { $set: updateData },
            { new: true }
        ).select("-passwordHash -verificationToken");

        return NextResponse.json({ message: "Profile updated", user: updatedUser });

    } catch (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
