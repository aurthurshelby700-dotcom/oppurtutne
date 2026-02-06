"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, UserCircle, MapPin, Briefcase } from "lucide-react";
import { updateUserProfile } from "@/lib/actions/user";
import { JobTitleSkillSelector } from "@/components/shared/JobTitleSkillSelector";

export default function ProfileSetupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [jobTitles, setJobTitles] = useState<string[]>([]);
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");
    const [skills, setSkills] = useState<string[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await updateUserProfile({
            name,
            jobTitles,
            bio,
            location,
            skills
        });

        if (result.success) {
            router.refresh();
            router.push("/");
        } else {
            console.error(result.error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background max-w-5xl mx-auto">
            <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-lg p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Set up your profile</h1>
                    <p className="text-muted-foreground">
                        Tell us a bit about yourself. You can edit this later.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <UserCircle className="h-4 w-4" /> Full Name
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="e.g. Vishnu K."
                        />
                    </div>

                    {/* Job Titles & Skills */}
                    <div className="space-y-4">
                        <JobTitleSkillSelector
                            selectedJobTitles={jobTitles}
                            selectedSkills={skills}
                            onJobTitlesChange={setJobTitles}
                            onSkillsChange={setSkills}
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Briefcase className="h-4 w-4" /> Bio / Headline
                        </label>
                        <textarea
                            required
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="e.g. Full Stack Developer specializing in Next.js"
                        />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Location
                        </label>
                        <input
                            type="text"
                            required
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="e.g. San Francisco, CA"
                        />
                    </div>


                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading || !name}
                            className="w-full px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? "Saving..." : "Complete Setup"} <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
