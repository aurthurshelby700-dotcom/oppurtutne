
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectToDatabase from "@/lib/db";
import Notification from "@/models/Notification";
import User from "@/models/User";

interface Params {
    params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, props: Params) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Find user ID (similar fallback logic as GET)
        let userId = session.user.id;
        if (!userId && session.user.email) {
            const user = await User.findOne({ email: session.user.email });
            if (user) userId = user._id.toString();
        }

        if (!userId) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const notification = await Notification.findOne({ _id: params.id, receiverId: userId });

        if (!notification) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        notification.isRead = true;
        await notification.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
