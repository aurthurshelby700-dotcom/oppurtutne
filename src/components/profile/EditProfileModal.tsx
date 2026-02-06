"use client";

import { useState } from "react";
import { Pencil, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { JobTitleSkillSelector } from "@/components/shared/JobTitleSkillSelector";
import FileUploader from "@/components/ui/FileUploader";

const Label = ({ children, htmlFor, className }: { children: React.ReactNode; htmlFor?: string; className?: string }) => (
    <label htmlFor={htmlFor} className={cn("text-sm font-bold tracking-tight text-foreground/80 mb-2 block", className)}>
        {children}
    </label>
);

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        className={cn(
            "flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            className
        )}
        {...props}
    />
);

const Textarea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
        className={cn(
            "flex min-h-[80px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            className
        )}
        {...props}
    />
);
export function EditProfileModal({ user, onProfileUpdate }: { user: any, onProfileUpdate?: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        jobTitles: user.jobTitles || (user.jobTitle ? [user.jobTitle] : []),
        bio: user.bio || "",
        pricePerHour: user.pricePerHour || 0,
        skills: user.skills || [],
        country: user.country || user.location || "",
        mobileNumber: user.mobileNumber || ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/users/${user.username}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    pricePerHour: Number(formData.pricePerHour)
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to update profile");
            }

            setOpen(false);
            router.refresh(); // Refresh Server Component
            if (onProfileUpdate) onProfileUpdate();
        } catch (error) {
            console.error(error);
            alert("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="hidden md:flex gap-2 items-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
                title="Edit Profile"
            >
                <Pencil className="h-4 w-4" /> Edit Profile
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background rounded-xl border border-border shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold">Edit Profile</h2>
                    <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-muted transition-colors">
                        <X className="h-5 w-5 opacity-70" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-8">

                        {/* 1. Identity */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <div className="h-1 w-4 bg-primary rounded-full" /> Personal Information
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="John"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                        </section>



                        {/* 3. EXPERTISE (Structured) */}
                        <section className="space-y-4 p-6 bg-muted/30 rounded-xl border border-border">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <div className="h-1 w-4 bg-primary rounded-full" /> Expertise & Skills
                            </h3>
                            <JobTitleSkillSelector
                                selectedJobTitles={formData.jobTitles}
                                selectedSkills={formData.skills}
                                onJobTitlesChange={(titles) => setFormData(prev => ({ ...prev, jobTitles: titles }))}
                                onSkillsChange={(skills) => setFormData(prev => ({ ...prev, skills }))}
                            />
                        </section>

                        {/* 4. Professional Details */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <div className="h-1 w-4 bg-primary rounded-full" /> Professional Details
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        placeholder="e.g. United States"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="pricePerHour">Hourly Rate ($)</Label>
                                    <Input
                                        id="pricePerHour"
                                        name="pricePerHour"
                                        type="number"
                                        value={formData.pricePerHour}
                                        onChange={handleChange}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bio">Professional Bio</Label>
                                <Textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                        </section>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="px-6 py-2 text-sm font-bold hover:bg-muted rounded-xl transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-profile-form"
                        disabled={loading || formData.jobTitles.length === 0}
                        className="flex items-center gap-2 px-8 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

