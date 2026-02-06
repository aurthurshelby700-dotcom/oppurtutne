
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectToDatabase from "@/lib/db";
import Notification from "@/models/Notification";
import User from "@/models/User";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const filter = searchParams.get("filter"); // 'unread' or 'all' (default)
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const skip = (page - 1) * limit;

        // Find user by email to get their ID if needed, 
        // though session.user.id SHOULD be available if correctly populated.
        // Fallback to email lookup if ID is missing from session for some reason.
        let userId = session.user.id;
        if (!userId && session.user.email) {
            const user = await User.findOne({ email: session.user.email });
            if (user) userId = user._id.toString();
        }

        if (!userId) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const query: any = { receiverId: userId };
        if (filter === "unread") {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
