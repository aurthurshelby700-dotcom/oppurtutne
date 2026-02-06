
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectToDatabase from "@/lib/db";
import Notification from "@/models/Notification";
import User from "@/models/User";

export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        let userId = session.user.id;
        if (!userId && session.user.email) {
            const user = await User.findOne({ email: session.user.email });
            if (user) userId = user._id.toString();
        }

        if (!userId) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await Notification.updateMany(
            { receiverId: userId, isRead: false },
            { $set: { isRead: true } }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
