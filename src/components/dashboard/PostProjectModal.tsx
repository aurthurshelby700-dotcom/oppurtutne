"use client";

import { useState } from "react";
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
        budget: "",
        skills: ""
    });
    const [isPosting, setIsPosting] = useState(false);

    const handlePostProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPosting(true);
        try {
            const { createProject } = await import("@/lib/actions/projects");
            const skills = postForm.skills.split(",").map(s => s.trim()).filter(Boolean);

            const result = await createProject({
                title: postForm.title,
                description: postForm.description,
                budget: parseFloat(postForm.budget) || 0,
                skills,
                category: "General" // Default category
            });

            if (result.success) {
                setPostForm({ title: "", description: "", budget: "", skills: "" });
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error("Failed to post:", error);
        } finally {
            setIsPosting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold mb-4">Post a New Project</h2>
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
                    <div>
                        <label className="block text-sm font-medium mb-1">Budget ($)</label>
                        <input
                            type="number"
                            className="w-full p-2 border rounded bg-background"
                            required
                            value={postForm.budget}
                            onChange={e => setPostForm({ ...postForm, budget: e.target.value })}
                            placeholder="500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Required Skills (Comma separated)</label>
                        <input
                            className="w-full p-2 border rounded bg-background"
                            value={postForm.skills}
                            onChange={e => setPostForm({ ...postForm, skills: e.target.value })}
                            placeholder="e.g. React, Node.js, Design"
                        />
                        <p className="text-xs text-muted-foreground mt-1">These will matching with freelancer skills.</p>
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
