"use client";

import { useState, useEffect } from "react";
import { Loader2, DollarSign, Layers, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { createProject } from "@/lib/actions/projects"; // We will add updateProject later if needed
import { useRouter } from "next/navigation";
import { SKILL_CATEGORIES } from "@/lib/categories";
import { SkillSelector } from "@/components/ui/SkillSelector";



interface ProjectFormProps {
    projectToEdit?: any;
    onSuccess?: () => void;
    onCancel?: () => void;
    isModal?: boolean;
    type?: "PROJECT" | "CONTEST"; // Added prop
}

export function ProjectForm({ projectToEdit, onSuccess, onCancel, isModal = false, type = "PROJECT" }: ProjectFormProps) {
    const router = useRouter();
    const [form, setForm] = useState({
        title: "",
        category: "",
        description: "",
        budget: "",
        skills: [] as string[],
        type: type // Initialize from prop
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Populate form if editing
    useEffect(() => {
        if (projectToEdit) {
            setForm({
                title: projectToEdit.title,
                category: projectToEdit.category || "",
                description: projectToEdit.description,
                budget: projectToEdit.budget.toString(),
                skills: projectToEdit.skills || [],
                type: projectToEdit.type || type
            });
        }
    }, [projectToEdit, type]);

    const handleSubmit = async () => {
        setError("");

        // Validation
        if (form.title.length < 5) { setError("Title too short"); return; }
        if (!form.category) { setError("Category is required"); return; }
        if (form.description.length < 50) { setError("Description must be at least 50 characters"); return; }
        if (parseFloat(form.budget) <= 0) { setError("Budget must be greater than 0"); return; }

        setIsLoading(true);
        try {
            const payload = {
                title: form.title,
                description: form.description,
                budget: parseFloat(form.budget),
                skills: form.skills,
                type: form.type,
                category: form.category
            };

            const result = await createProject(payload);

            if (result.error) {
                setError(result.error);
            } else {
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("space-y-6", isModal ? "" : "bg-card p-8 rounded-xl border border-border")}>
            {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                    {error}
                </div>
            )}

            {/* Type Switcher REMOVED */}

            {/* Title */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
                <input
                    type="text"
                    maxLength={100}
                    className="w-full p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder={form.type === 'PROJECT' ? "e.g. Build a React Website" : "e.g. Design a Logo for a Coffee Shop"}
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                />
            </div>

            {/* Category */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Category <span className="text-destructive">*</span></label>
                <div className="relative">
                    <select
                        className="w-full p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                    >
                        <option value="">Select a Category</option>
                        {SKILL_CATEGORIES.map(cat => (
                            <option key={cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                    <Layers className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Budget / Prize ($) <span className="text-destructive">*</span></label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        type="number"
                        min="1"
                        className="w-full pl-9 p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="500"
                        value={form.budget}
                        onChange={e => setForm({ ...form, budget: e.target.value })}
                    />
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Description <span className="text-destructive">*</span></label>
                <textarea
                    className="w-full p-3 rounded-lg border bg-background h-32 focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                    placeholder="Describe requirements, deliverables, and expectations..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                />
                <div className={cn(
                    "text-xs text-right transition-colors",
                    form.description.length < 50 ? "text-amber-500" : "text-muted-foreground"
                )}>
                    {form.description.length} / 50 characters required
                </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Required Skills</label>
                <SkillSelector
                    selectedSkills={form.skills}
                    onChange={skills => setForm({ ...form, skills })}
                    category={form.category}
                />
            </div>

            {/* Footer / Actions */}
            <div className={cn("flex justify-end gap-3", isModal ? "p-6 -mx-6 -mb-6 border-t border-border bg-muted/30 mt-6" : "pt-4 border-t border-border")}>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Post {form.type === 'PROJECT' ? "Project" : "Contest"}
                </button>
            </div>
        </div>
    );
}
