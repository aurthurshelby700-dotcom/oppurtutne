import { getProjectById, getSimilarProjects } from "@/lib/actions/data";
import { checkIsSaved } from "@/lib/actions/saved";
import { ProjectDetailView } from "@/components/dashboard/ProjectDetailView";
import { notFound } from "next/navigation";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = await getProjectById(id);

    if (!project) return notFound();

    const [similarProjects, isSaved] = await Promise.all([
        getSimilarProjects(id, project.skills),
        checkIsSaved(id)
    ]);

    return <ProjectDetailView project={project} similarProjects={similarProjects} isSaved={isSaved} />;
}
