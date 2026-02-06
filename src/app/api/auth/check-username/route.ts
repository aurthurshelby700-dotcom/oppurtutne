import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username || username.length < 3) {
        return NextResponse.json(
            { error: "Invalid username" },
            { status: 400 }
        );
    }

    try {
        await connectToDatabase();

        const existingUser = await User.findOne({ username: username.toLowerCase() });

        return NextResponse.json({
            available: !existingUser
        });
    } catch (error) {
        console.error("Error checking username:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
