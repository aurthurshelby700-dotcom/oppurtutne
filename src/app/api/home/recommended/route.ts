
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import Service from "@/models/Service";
import Contest from "@/models/Contest";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const role = session.user.role; // 'freelancer' | 'client' | 'both'

        // Determine what to show based on active mode if passed, or default to role
        // For 'both', usually the UI sends an active mode.
        // Requirement: "IF ROLE = FREELANCER: Show PROJECT cards... IF ROLE = CLIENT: Show SERVICE cards"

        // We'll trust the query param or default to session role. 
        // Ideally the frontend sends ?mode=freelancer or ?mode=client
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get("mode") || role;

        let items = [];

        if (mode === 'freelancer') {
            // Show Projects and Contests
            const projects = await Project.find({ status: 'open' }).sort({ createdAt: -1 }).limit(5).lean();
            const contests = await Contest.find({ status: 'open' }).sort({ createdAt: -1 }).limit(5).lean();

            // Interleave or combine and Add Bid Stats
            const Bid = (await import("@/models/Bid")).default;
            const combined = [
                ...projects.map(p => ({ ...p, type: 'project' })),
                ...contests.map(c => ({ ...c, type: 'contest' }))
            ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            items = await Promise.all(combined.map(async (item: any) => {
                if (item.type === 'project') {
                    const bids = await Bid.find({ projectId: item._id }).lean();
                    const acceptedBid = bids.find((b: any) => b.status === 'accepted');

                    let avgBid = 0;
                    if (bids.length > 0) {
                        const sum = bids.reduce((acc: number, b: any) => acc + (b.bidAmount || 0), 0);
                        avgBid = Math.round(sum / bids.length);
                    }

                    return {
                        ...item,
                        avgBid,
                        bidCount: bids.length,
                        acceptedBidAmount: acceptedBid?.bidAmount
                    };
                }
                return item;
            }));

        } else {
            // Client mode (or 'both' defaulting to client view logic if unspecified?)
            // "IF ROLE = CLIENT: Show SERVICE cards"
            // If mode is 'both' and not specified, maybe we return mixed or default to freelancer view?
            // Let's assume 'client' view shows Services.

            const services = await Service.find({}).sort({ createdAt: -1 }).limit(10).lean();
            items = services.map(s => ({ ...s, type: 'service' }));
        }

        return NextResponse.json({ items });
    } catch (error) {
        console.error("Recommended API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
