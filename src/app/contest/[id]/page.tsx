import { getContestById, getSimilarContests } from "@/lib/actions/data";
import { checkIsSaved } from "@/lib/actions/saved";
import { ContestDetailView } from "@/components/dashboard/ContestDetailView";
import { notFound } from "next/navigation";

export default async function ContestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const contest = await getContestById(id);

    if (!contest) return notFound();

    const [similarContests, isSaved] = await Promise.all([
        getSimilarContests(id, contest.skills),
        checkIsSaved(id)
    ]);

    return <ContestDetailView contest={contest} similarContests={similarContests} isSaved={isSaved} />;
}
