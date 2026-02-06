"use client";

import { useState, useEffect } from "react";
import { X, Loader2, DollarSign, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { createService, updateService, ServiceData } from "@/lib/actions/services";
import { useRouter } from "next/navigation";
import { JobTitleSkillSelector } from "@/components/shared/JobTitleSkillSelector";

interface ServiceFormProps {
    serviceToEdit?: any;
    onSuccess?: () => void; // Optional callback
    onCancel?: () => void; // Optional callback
    isModal?: boolean; // Styling adjustment
}


export function ServiceForm({ serviceToEdit, onSuccess, onCancel, isModal = false }: ServiceFormProps) {
    const router = useRouter();
    const [form, setForm] = useState<ServiceData>({
        title: "",
        jobTitles: [],
        description: "",
        pricingType: "fixed",
        price: 0,
        skills: [],
        deliveryTime: "",
        status: "draft"
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Populate form if editing
    useEffect(() => {
        if (serviceToEdit) {
            setForm({
                title: serviceToEdit.title,
                jobTitles: serviceToEdit.jobTitles || [],
                description: serviceToEdit.description,
                pricingType: serviceToEdit.pricingType || "fixed",
                price: serviceToEdit.price,
                skills: serviceToEdit.skills || [],
                deliveryTime: serviceToEdit.deliveryTime || "",
                status: serviceToEdit.status
            });
        }
    }, [serviceToEdit]);

    const handleSubmit = async (action: 'draft' | 'publish') => {
        setError("");

        // Validation for Publish
        if (action === 'publish') {
            if (form.title.length < 5) { setError("Title too short"); return; }
            if (form.jobTitles.length === 0) { setError("At least one job title is required"); return; }
            if (form.description.length < 50) { setError("Description must be at least 50 characters"); return; }
            if (form.skills.length === 0) { setError("Add at least one skill"); return; }
            if (form.price <= 0) { setError("Price must be greater than 0"); return; }
        }

        setIsLoading(true);
        try {
            const payload = { ...form, status: action === 'publish' ? 'active' : 'draft' } as ServiceData;

            let result;
            if (serviceToEdit) {
                result = await updateService(serviceToEdit._id, payload);
            } else {
                result = await createService(payload);
            }

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
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Service Title <span className="text-destructive">*</span></label>
                <input
                    type="text"
                    maxLength={100}
                    className="w-full p-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium h-14"
                    placeholder="e.g. Professional Logo Design in 24 Hours"
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

            {/* Description */}
            <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Description <span className="text-destructive">*</span></label>
                <textarea
                    className="w-full p-4 rounded-xl border bg-background h-48 focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                    placeholder="Describe your service in detail..."
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

            {/* Pricing & Delivery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pricing Type</label>
                    <div className="flex rounded-xl border p-1 bg-muted/50 h-14">
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, pricingType: 'fixed' })}
                            className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                                form.pricingType === 'fixed' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Fixed
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, pricingType: 'hourly' })}
                            className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                                form.pricingType === 'hourly' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Hourly
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Price ($)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-4 top-4.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="number"
                            min="1"
                            className="w-full pl-12 p-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none h-14 font-medium"
                            placeholder="50"
                            value={form.price || ""}
                            onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Delivery Time</label>
                    <div className="relative">
                        <Clock className="absolute left-4 top-4.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            className="w-full pl-12 p-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none h-14 font-medium"
                            placeholder="e.g. 3 Days"
                            value={form.deliveryTime || ""}
                            onChange={e => setForm({ ...form, deliveryTime: e.target.value })}
                        />
                    </div>
                </div>
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
                    onClick={() => handleSubmit('draft')}
                    disabled={isLoading}
                    className="px-5 py-2.5 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                    Save as Draft
                </button>
                <button
                    type="button"
                    onClick={() => handleSubmit('publish')}
                    disabled={isLoading}
                    className="px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Publish Service
                </button>
            </div>
        </div>
    );
}
