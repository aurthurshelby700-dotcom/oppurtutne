"use client";

import { useState, useEffect } from "react";
import { X, Loader2, DollarSign, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { createService, updateService, ServiceData } from "@/lib/actions/services";
import { useRouter } from "next/navigation";
import { SKILL_CATEGORIES } from "@/lib/categories";
import { SkillSelector } from "@/components/ui/SkillSelector";

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
        category: "",
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
                category: serviceToEdit.category || "",
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
            if (!form.category) { setError("Category is required"); return; }
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
        <div className={cn("space-y-6", isModal ? "" : "bg-card p-8 rounded-xl border border-border")}>
            {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                    {error}
                </div>
            )}

            {/* Title */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Service Title <span className="text-destructive">*</span></label>
                <input
                    type="text"
                    maxLength={100}
                    className="w-full p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder="e.g. Professional Logo Design in 24 Hours"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                />
                <div className="text-xs text-muted-foreground text-right">{form.title.length}/100</div>
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

            {/* Description */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Description <span className="text-destructive">*</span></label>
                <textarea
                    className="w-full p-3 rounded-lg border bg-background h-32 focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                    placeholder="Describe your service in detail..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                />
                <div className={cn(
                    "text-xs text-right transition-colors",
                    form.description.length < 50 ? "text-amber-500" : "text-muted-foreground"
                )}>
                    {form.description.length} / 50 characters required
                </div>
                {form.description.length > 0 && form.description.length < 50 && (
                    <p className="text-xs text-amber-500">
                        💡 Clear services get 3x more engagement. Add a bit more detail!
                    </p>
                )}
            </div>

            {/* Pricing & Delivery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Pricing Type</label>
                    <div className="flex rounded-lg border p-1 bg-muted/50">
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, pricingType: 'fixed' })}
                            className={cn(
                                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                form.pricingType === 'fixed' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Fixed Price
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, pricingType: 'hourly' })}
                            className={cn(
                                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                form.pricingType === 'hourly' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Hourly Rate
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Price ($)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                            type="number"
                            min="1"
                            className="w-full pl-9 p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="50"
                            value={form.price || ""}
                            onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Delivery Time</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            className="w-full pl-9 p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="e.g. 3 Days"
                            value={form.deliveryTime || ""}
                            onChange={e => setForm({ ...form, deliveryTime: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Skills / Tags <span className="text-destructive">*</span></label>
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
