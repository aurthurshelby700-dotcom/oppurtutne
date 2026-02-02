"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Loader2, Layers } from "lucide-react";
import { SKILL_CATEGORIES } from "@/lib/categories";
import { SkillSelector } from "@/components/ui/SkillSelector";

export default function PostProjectPage() {
    const { activeMode, user } = useUser();
    const router = useRouter();
    const [isPosting, setIsPosting] = useState(false);
    const [postForm, setPostForm] = useState({
        title: "",
        category: "",
        description: "",
        budget: "",
        skills: [] as string[],
        type: "PROJECT" as "PROJECT" | "CONTEST",
        deliverables: [] as string[]
    });
    const [error, setError] = useState("");

    const DELIVERABLE_FORMATS = {
        "Image Formats": ["PNG", "JPEG", "JPG", "SVG", "AI"],
        "Video Formats": ["MP4"],
        "Document Formats": ["PDF", "DOC", "DOCX", "WORD", "DOCS"]
    };

    // Redirect if not client mode
    useEffect(() => {
        if (activeMode !== 'client') {
            router.push('/');
        }
    }, [activeMode, router]);

    if (activeMode !== 'client') {
        return null; // Return null while redirecting
    }

    const handleDeliverableChange = (format: string) => {
        setPostForm(prev => {
            if (prev.deliverables.includes(format)) {
                return { ...prev, deliverables: prev.deliverables.filter(f => f !== format) };
            } else {
                return { ...prev, deliverables: [...prev.deliverables, format] };
            }
        });
    };

    const handlePostProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPosting(true);
        setError("");

        if (!postForm.category) {
            setError("Please select a category");
            setIsPosting(false);
            return;
        }

        if (postForm.type === "CONTEST" && postForm.deliverables.length === 0) {
            setError("Please select at least one deliverable file format.");
            setIsPosting(false);
            return;
        }

        try {
            const { createProject } = await import("@/lib/actions/projects");

            const result = await createProject({
                title: postForm.title,
                category: postForm.category,
                description: postForm.description,
                budget: parseFloat(postForm.budget) || 0,
                skills: postForm.skills,
                type: postForm.type,
                deliverables: postForm.type === "CONTEST" ? postForm.deliverables : []
            });

            if (result.success) {
                router.push('/'); // Go back to dashboard/browse
            } else {
                setError(result.error || "Failed to create project");
            }
        } catch (error) {
            console.error("Failed to post:", error);
            setError("An unexpected error occurred");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Post a {postForm.type === "PROJECT" ? "Project" : "Contest"}</h1>
                <p className="text-muted-foreground mt-2">
                    {postForm.type === "PROJECT"
                        ? "Hire a freelancer for a specific job."
                        : "Receive multiple entries and pick the best one."}
                </p>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handlePostProject} className="space-y-8 bg-card p-8 rounded-xl border border-border">
                {/* Project Type Toggle */}
                <div className="flex p-1 bg-muted rounded-lg w-fit">
                    <button
                        type="button"
                        onClick={() => setPostForm({ ...postForm, type: "PROJECT" })}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${postForm.type === "PROJECT"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Project
                    </button>
                    <button
                        type="button"
                        onClick={() => setPostForm({ ...postForm, type: "CONTEST" })}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${postForm.type === "CONTEST"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Contest
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <input
                            type="text"
                            className="w-full p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                            value={postForm.title}
                            onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                            required
                            placeholder={`e.g. ${postForm.type === "PROJECT" ? "Build a React Website" : "Design a Logo for Tech Startup"}`}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <div className="relative">
                            <select
                                className="w-full p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                                value={postForm.category}
                                onChange={e => setPostForm({ ...postForm, category: e.target.value })}
                                required
                            >
                                <option value="">Select a Category</option>
                                {SKILL_CATEGORIES.map(cat => (
                                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                            <Layers className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{postForm.type === "PROJECT" ? "Budget ($)" : "Prize Amount ($)"}</label>
                        <input
                            type="number"
                            className="w-full p-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                            required
                            value={postForm.budget}
                            onChange={e => setPostForm({ ...postForm, budget: e.target.value })}
                            placeholder="500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                            className="w-full p-3 border rounded-lg bg-background min-h-[150px] focus:ring-2 focus:ring-primary/20 transition-all"
                            required
                            value={postForm.description}
                            onChange={e => setPostForm({ ...postForm, description: e.target.value })}
                            placeholder="Provide detailed requirements..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Required Skills</label>
                        <SkillSelector
                            selectedSkills={postForm.skills}
                            onChange={skills => setPostForm({ ...postForm, skills })}
                            category={postForm.category}
                        />
                    </div>

                    {/* Deliverable File Formats (Contest Only) */}
                    {postForm.type === "CONTEST" && (
                        <div className="space-y-3 pt-4 border-t border-border">
                            <label className="text-base font-semibold block">
                                Deliverable File Formats <span className="text-destructive">*</span>
                            </label>
                            <p className="text-sm text-muted-foreground mb-3">
                                Select the file formats you expect to receive from freelancers.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {Object.entries(DELIVERABLE_FORMATS).map(([group, formats]) => (
                                    <div key={group} className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">{group}</h4>
                                        <div className="space-y-2">
                                            {formats.map(format => (
                                                <label key={format} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        value={format}
                                                        checked={postForm.deliverables.includes(format)}
                                                        onChange={() => handleDeliverableChange(format)}
                                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    />
                                                    <span className="text-sm">{format}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-6 flex items-center justify-end gap-4 border-t border-border">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isPosting}
                        className="px-8 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isPosting ? "Posting..." : `Post ${postForm.type === "PROJECT" ? "Project" : "Contest"}`}
                    </button>
                </div>
            </form>
        </div>
    );
}
