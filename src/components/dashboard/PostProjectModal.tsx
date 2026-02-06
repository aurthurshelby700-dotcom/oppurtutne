"use client";

import { useState } from "react";
import { JobTitleSkillSelector } from "@/components/shared/JobTitleSkillSelector";
import { Loader2 } from "lucide-react";

interface PostProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function PostProjectModal({ isOpen, onClose, onSuccess }: PostProjectModalProps) {
    const [postForm, setPostForm] = useState({
        title: "",
        description: "",
        budgetMin: "",
        budgetMax: "",
        jobTitles: [] as string[],
        skills: [] as string[]
    });
    const [isPosting, setIsPosting] = useState(false);
    const [error, setError] = useState("");

    const handlePostProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const min = parseFloat(postForm.budgetMin);
        const max = parseFloat(postForm.budgetMax);

        if (isNaN(min) || min <= 0) {
            setError("Please enter a valid minimum budget greater than 0.");
            return;
        }
        if (isNaN(max) || max <= min) {
            setError("Maximum budget must be greater than minimum budget.");
            return;
        }

        setIsPosting(true);
        try {
            const { createProject } = await import("@/lib/actions/projects");
            const payload = {
                title: postForm.title,
                description: postForm.description,
                budgetMin: min,
                budgetMax: max,
                skills: postForm.skills,
                jobTitles: postForm.jobTitles,
                type: 'project' as const
            };

            console.log("Submitting project payload:", payload); // Debug log

            const result = await createProject(payload);

            if (result.success) {
                setPostForm({ title: "", description: "", budgetMin: "", budgetMax: "", jobTitles: [], skills: [] });
                onSuccess();
                onClose();
            } else if (result.error) {
                setError(result.error);
            }
        } catch (error) {
            console.error("Failed to post:", error);
            setError("An unexpected error occurred.");
        } finally {
            setIsPosting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold mb-4">Post a New Project</h2>
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm border border-red-200">
                        {error}
                    </div>
                )}
                <form onSubmit={handlePostProject} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Project Title</label>
                        <input
                            className="w-full p-2 border rounded bg-background"
                            required
                            value={postForm.title}
                            onChange={e => setPostForm({ ...postForm, title: e.target.value })}
                            placeholder="e.g. Build a Marketing Website"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Min Budget ($)</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded bg-background"
                                required
                                min="1"
                                value={postForm.budgetMin}
                                onChange={e => setPostForm({ ...postForm, budgetMin: e.target.value })}
                                placeholder="Min"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Max Budget ($)</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded bg-background"
                                required
                                min="1"
                                value={postForm.budgetMax}
                                onChange={e => setPostForm({ ...postForm, budgetMax: e.target.value })}
                                placeholder="Max"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <JobTitleSkillSelector
                            selectedJobTitles={postForm.jobTitles}
                            selectedSkills={postForm.skills}
                            onJobTitlesChange={(titles: string[]) => setPostForm({ ...postForm, jobTitles: titles })}
                            onSkillsChange={(skills: string[]) => setPostForm({ ...postForm, skills })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            className="w-full p-2 border rounded bg-background h-32"
                            required
                            value={postForm.description}
                            onChange={e => setPostForm({ ...postForm, description: e.target.value })}
                            placeholder="Describe your project requirements..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-muted rounded text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPosting}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium flex items-center gap-2"
                        >
                            {isPosting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isPosting ? "Posting..." : "Post Project"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
