import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

const parseToken = (token: string) => {
    try {
        const payload = token.split(".")[1];
        if (!payload) return null;
        const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
        return decoded;
    } catch (e) {
        return null;
    }
};

export async function GET(req: NextRequest) {
    try {
        let userEmail: string | undefined;

        // 1. Try Standard Auth
        const session = await auth();
        if (session && session.user?.email) {
            userEmail = session.user.email;
        }

        // 2. Fallback: Custom Token
        if (!userEmail) {
            const token = req.cookies.get("token")?.value;
            if (token) {
                const decoded = parseToken(token);
                // Payload has userId, username. Lookup by username (unique)
                if (decoded?.username) {
                    await connectToDatabase();
                    // Identify user by username
                    const userByToken = await User.findOne({ username: decoded.username.toLowerCase() }).select("email");
                    if (userByToken) {
                        userEmail = userByToken.email;
                    }
                }
            }
        }

        if (!userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findOne({ email: userEmail }).select("-passwordHash -verificationToken");

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Fetch profile error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        let userEmail: string | undefined;

        const session = await auth();
        if (session && session.user?.email) {
            userEmail = session.user.email;
        }

        if (!userEmail) {
            const token = req.cookies.get("token")?.value;
            if (token) {
                const decoded = parseToken(token);
                if (decoded?.username) {
                    await connectToDatabase();
                    const userByToken = await User.findOne({ username: decoded.username.toLowerCase() }).select("email");
                    if (userByToken) userEmail = userByToken.email;
                }
            }
        }

        if (!userEmail) {
            console.log("SetupProfile Debug - Unauthorized: No session or valid token");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { firstName, lastName, username, role, jobTitles, bio, pricePerHour, skills, country, mobileNumber } = body;

        // Validation - ensure standardized jobTitles and skills are present
        if (!firstName || !lastName || !username || !jobTitles || jobTitles.length === 0 || !bio || !pricePerHour || !skills || skills.length === 0 || !country) {
            return NextResponse.json(
                { error: "Missing required fields. Please select at least one Job Title and some Skills." },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const updatedUser = await User.findOneAndUpdate(
            { email: userEmail },
            {
                firstName,
                lastName,
                username: username.toLowerCase(),
                role,
                jobTitles,
                bio,
                pricePerHour,
                skills,
                country,
                location: country,
                mobileNumber,
                profileCompleted: true
            },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Profile updated successfully", user: updatedUser },
            { status: 200 }
        );

    } catch (error) {
        console.error("Profile setup error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
