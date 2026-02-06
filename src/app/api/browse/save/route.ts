import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import SavedItem from "@/models/SavedItem";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { itemId, itemType } = await req.json();

        if (!itemId || !itemType) {
            return NextResponse.json({ error: "Missing itemId or itemType" }, { status: 400 });
        }

        // Check if already saved
        const existing = await SavedItem.findOne({
            user: session.user.id,
            item: itemId,
            itemType
        });

        if (existing) {
            // Toggle off (delete)
            await SavedItem.deleteOne({ _id: existing._id });
            return NextResponse.json({ saved: false });
        } else {
            // Toggle on (create)
            await SavedItem.create({
                user: session.user.id,
                item: itemId,
                itemType
            });
            return NextResponse.json({ saved: true });
        }

    } catch (error: any) {
        console.error("Save API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get("itemId");

        if (itemId) {
            // Check status for specific item
            const existing = await SavedItem.findOne({
                user: session.user.id,
                item: itemId
            });
            return NextResponse.json({ saved: !!existing });
        }

        // Return all saved items for user
        const savedItems = await SavedItem.find({ user: session.user.id })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ savedItems });

    } catch (error: any) {
        console.error("Save GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
