"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, DollarSign, User, Globe, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { JobTitleSkillSelector } from "@/components/shared/JobTitleSkillSelector";

export default function SetupProfilePage() {
    const router = useRouter();
    const { data: session, update } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial data loading state
    const [isFetchingUser, setIsFetchingUser] = useState(true);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        role: "both" as "freelancer" | "client" | "both",
        jobTitles: [] as string[],
        bio: "",
        pricePerHour: "" as string | number,
        skills: [] as string[],
        country: "",
        mobileNumber: ""
    });

    // Fetch initial user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch("/api/user/setup-profile");
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setFormData(prev => ({
                            ...prev,
                            firstName: data.user.firstName || "",
                            lastName: data.user.lastName || "",
                            username: data.user.username || "",
                            role: data.user.role || "both",
                            jobTitles: data.user.jobTitles || [],
                            bio: data.user.bio || "",
                            pricePerHour: data.user.pricePerHour || "",
                            skills: data.user.skills || [],
                            country: data.user.country || "",
                            mobileNumber: data.user.mobileNumber || ""
                        }));
                        return;
                    }
                }

                if (session?.user?.name) {
                    const parts = session.user.name.split(" ");
                    setFormData(prev => ({
                        ...prev,
                        firstName: parts[0] || "",
                        lastName: parts.slice(1).join(" ") || ""
                    }));
                }
            } catch (err) {
                console.error("Failed to load user data");
                if (session?.user?.name) {
                    const parts = session.user.name.split(" ");
                    setFormData(prev => ({
                        ...prev,
                        firstName: parts[0] || "",
                        lastName: parts.slice(1).join(" ") || ""
                    }));
                }
            } finally {
                setIsFetchingUser(false);
            }
        };

        if (session) {
            fetchUserData();
        } else {
            const timer = setTimeout(() => setIsFetchingUser(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [session]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleSelect = (role: "freelancer" | "client" | "both") => {
        setFormData(prev => ({ ...prev, role }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/user/setup-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    pricePerHour: Number(formData.pricePerHour)
                })
            });

            let data;
            try {
                data = await res.json();
            } catch (jsonError) {
                console.error("JSON Parse Error:", jsonError);
                throw new Error("Server returned an invalid response.");
            }

            if (!res.ok) {
                throw new Error(data.error || "Failed to update profile");
            }

            // Trigger session update and redirect simultaneously
            // We don't necessarily need to await update() fully before pushing
            // especially if the user is frustrated with the wait.
            // However, update() is usually needed for the UI to reflect new role.
            try {
                await update({
                    profileCompleted: true,
                    role: formData.role
                });
            } catch (updateErr) {
                console.warn("Session update took too long or failed, redirecting anyway", updateErr);
            }

            // Go to home immediately
            window.location.href = "/";

        } catch (err: any) {
            setError(err.message || "Unable to save profile. Please try again.");
            setIsLoading(false);
        }
    };

    const isSubmitDisabled =
        isLoading ||
        formData.jobTitles.length === 0 ||
        !formData.bio ||
        !formData.pricePerHour ||
        Number(formData.pricePerHour) < 0 ||
        formData.skills.length === 0 ||
        !formData.country;

    if (isFetchingUser && !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-start overflow-y-auto py-10 px-4">
            <div className="w-full max-w-4xl bg-card border border-border rounded-xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300 mb-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight">Complete Your Profile</h1>
                    <p className="text-muted-foreground mt-3 text-lg">
                        Select your expertise and skills to help us match you with the right opportunities.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12">

                    {/* Basic Info Section */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                            <User className="h-5 w-5 text-primary" /> Personal Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">First Name <span className="text-red-500">*</span></label>
                                <input
                                    name="firstName"
                                    required
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
                                <input
                                    name="lastName"
                                    required
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Username <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <User className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                                    <input
                                        name="username"
                                        required
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 pl-12 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all lowercase"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium">I am using Opportune as a...</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {(['freelancer', 'client', 'both'] as const).map((r) => (
                                    <div
                                        key={r}
                                        onClick={() => handleRoleSelect(r)}
                                        className={cn(
                                            "cursor-pointer border-2 rounded-xl p-4 text-center transition-all hover:border-primary relative font-bold",
                                            formData.role === r ? "border-primary bg-primary/5 text-primary" : "border-border bg-card"
                                        )}
                                    >
                                        <span className="capitalize">{r}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Expertise Section */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                            <Briefcase className="h-5 w-5 text-primary" /> Expertise & Skills
                        </h2>

                        <JobTitleSkillSelector
                            selectedJobTitles={formData.jobTitles}
                            selectedSkills={formData.skills}
                            onJobTitlesChange={(jobTitles) => setFormData(prev => ({ ...prev, jobTitles }))}
                            onSkillsChange={(skills) => setFormData(prev => ({ ...prev, skills }))}
                        />
                    </div>

                    {/* Professional Info Section */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                            <Globe className="h-5 w-5 text-primary" /> Professional Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Hourly Rate (USD) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                                    <input
                                        name="pricePerHour"
                                        type="number"
                                        required
                                        value={formData.pricePerHour}
                                        onChange={handleChange}
                                        className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 pl-12 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Country <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                                    <input
                                        name="country"
                                        required
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 pl-12 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Professional Bio <span className="text-red-500">*</span></label>
                            <textarea
                                name="bio"
                                required
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Write a brief professional summary..."
                                className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                            <p className="text-xs text-muted-foreground text-right">{formData.bio.length}/500</p>
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl flex items-center border border-red-200">
                            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="pt-8 border-t border-border">
                        <button
                            type="submit"
                            disabled={isSubmitDisabled}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 rounded-xl font-bold text-xl transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <><Loader2 className="h-6 w-6 animate-spin" /> Saving Profile...</>
                            ) : (
                                <>Complete Setup <ArrowRight className="h-6 w-6" /></>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

