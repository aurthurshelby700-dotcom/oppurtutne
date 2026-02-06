"use client";

import { useState, useEffect } from "react";
import { Loader2, DollarSign, Layers, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { createProject } from "@/lib/actions/projects"; // We will add updateProject later if needed
import { useRouter } from "next/navigation";
import { JobTitleSkillSelector } from "@/components/shared/JobTitleSkillSelector";
import { DELIVERABLE_FORMATS } from "@/lib/constants";

interface ProjectFormProps {
    projectToEdit?: any;
    onSuccess?: () => void;
    onCancel?: () => void;
    isModal?: boolean;
    type?: "project" | "contest";
}

export function ProjectForm({ projectToEdit, onSuccess, onCancel, isModal = false, type = "project" }: ProjectFormProps) {
    const router = useRouter();
    const [form, setForm] = useState({
        title: "",
        jobTitles: [] as string[],
        description: "",
        budgetMin: "",
        budgetMax: "",
        skills: [] as string[],
        deliverableFormats: [] as string[],
        type: type
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Populate form if editing
    useEffect(() => {
        if (projectToEdit) {
            setForm({
                title: projectToEdit.title,
                jobTitles: projectToEdit.jobTitles || [],
                description: projectToEdit.description,
                budgetMin: projectToEdit.budgetMin?.toString() || "",
                budgetMax: projectToEdit.budgetMax?.toString() || projectToEdit.prizeAmount?.toString() || "",
                skills: projectToEdit.skills || [],
                deliverableFormats: projectToEdit.deliverableFormats || [],
                type: projectToEdit.type || type
            });
        }
    }, [projectToEdit, type]);

    const handleSubmit = async () => {
        setError("");

        // Validation
        if (form.title.length < 5) { setError("Title too short"); return; }
        if (form.jobTitles.length === 0) { setError("At least one job title is required"); return; }
        if (form.description.length < 50) { setError("Description must be at least 50 characters"); return; }

        const min = parseFloat(form.budgetMin);
        const max = parseFloat(form.budgetMax);

        if (form.type === 'project') {
            if (isNaN(min) || min <= 0) { setError("Minimum budget must be greater than 0"); return; }
            if (isNaN(max) || max <= min) { setError("Maximum budget must be greater than minimum budget"); return; }
        } else {
            // Contest
            if (isNaN(max) || max <= 0) { setError("Prize amount must be greater than 0"); return; }
        }

        if (form.skills.length === 0) { setError("At least one skill is required"); return; }
        if (form.type === 'contest' && form.deliverableFormats.length === 0) { setError("At least one deliverable format is required"); return; }

        setIsLoading(true);
        try {
            const payload = {
                title: form.title,
                description: form.description,
                budgetMin: form.type === 'contest' ? 0 : parseFloat(form.budgetMin),
                budgetMax: parseFloat(form.budgetMax),
                jobTitles: form.jobTitles,
                skills: form.skills,
                deliverableFormats: form.deliverableFormats,
                type: form.type
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
        <div className={cn("space-y-8", isModal ? "" : "bg-card p-8 rounded-xl border border-border")}>
            {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                    {error}
                </div>
            )}

            {/* Title */}
            <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Title <span className="text-destructive">*</span></label>
                <input
                    type="text"
                    maxLength={100}
                    className="w-full p-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium h-14"
                    placeholder={form.type === 'project' ? "e.g. Build a React Website" : "e.g. Design a Logo for a Coffee Shop"}
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                />
            </div>

            {/* Job Title & Skill Selection */}
            <JobTitleSkillSelector
                selectedJobTitles={form.jobTitles}
                selectedSkills={form.skills}
                onJobTitlesChange={titles => setForm({ ...form, jobTitles: titles })}
                onSkillsChange={skills => setForm({ ...form, skills })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Budget */}
                {form.type === 'project' ? (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Min Budget ($) <span className="text-destructive">*</span></label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-4.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full pl-12 p-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none h-14 font-medium"
                                    placeholder="Min"
                                    value={form.budgetMin}
                                    onChange={e => setForm({ ...form, budgetMin: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Max Budget ($) <span className="text-destructive">*</span></label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-4.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full pl-12 p-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none h-14 font-medium"
                                    placeholder="Max"
                                    value={form.budgetMax}
                                    onChange={e => setForm({ ...form, budgetMax: e.target.value })}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Contest Prize ($) <span className="text-destructive">*</span></label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-4.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="number"
                                min="1"
                                className="w-full pl-12 p-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none h-14 font-medium"
                                placeholder="500"
                                value={form.budgetMax}
                                onChange={e => setForm({ ...form, budgetMax: e.target.value })}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Description <span className="text-destructive">*</span></label>
                <textarea
                    className="w-full p-4 rounded-xl border bg-background h-48 focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                    placeholder="Describe requirements, deliverables, and expectations in detail..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                />
                <div className={cn(
                    "text-xs text-right transition-colors font-medium",
                    form.description.length < 50 ? "text-amber-500" : "text-muted-foreground"
                )}>
                    {form.description.length} / 50 characters required
                </div>
            </div>

            {/* Deliverable Formats Selection (Contest Only) */}
            {form.type === 'contest' && (
                <div className="space-y-6 bg-muted/30 p-6 rounded-2xl border border-border">
                    <div className="space-y-1">
                        <label className="text-sm font-black uppercase tracking-widest text-foreground">Deliverable Formats <span className="text-destructive">*</span></label>
                        <p className="text-xs text-muted-foreground">Select the exact file formats you will accept for entries.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {Object.entries(DELIVERABLE_FORMATS).map(([category, formats]) => (
                            <div key={category} className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-2">
                                    {category.replace(/_/g, ' ')}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {formats.map(format => (
                                        <label
                                            key={format}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer select-none",
                                                form.deliverableFormats.includes(format)
                                                    ? "bg-primary/10 border-primary text-primary shadow-sm"
                                                    : "bg-background border-border text-muted-foreground hover:border-primary/50"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={form.deliverableFormats.includes(format)}
                                                onChange={(e) => {
                                                    const newFormats = e.target.checked
                                                        ? [...form.deliverableFormats, format]
                                                        : form.deliverableFormats.filter(f => f !== format);
                                                    setForm({ ...form, deliverableFormats: newFormats });
                                                }}
                                            />
                                            <span className="text-xs font-black uppercase">{format}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                    Post {form.type === 'project' ? "Project" : "Contest"}
                </button>
            </div>
        </div>
    );
}
