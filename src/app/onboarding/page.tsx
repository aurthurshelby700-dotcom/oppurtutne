"use client";

import { Check, User, Briefcase, Users, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { updateUserRole } from "@/lib/actions/auth";
import { useSession } from "next-auth/react";

type Role = "freelancer" | "client" | "both";

export default function OnboardingPage() {
    const router = useRouter();
    const { update } = useSession();
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = async () => {
        if (selectedRole) {
            setIsLoading(true);
            const result = await updateUserRole(selectedRole);
            if (result.success) {
                // Force session update to reflect new role
                await update({ role: selectedRole });
                console.log("Role updated, redirecting to /onboarding/profile");
                router.push("/onboarding/profile");
            } else {
                console.error("Failed to update role");
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background max-w-5xl mx-auto">
            <div className="text-center mb-12 max-w-2xl">
                <h1 className="text-3xl font-bold mb-4">How do you want to use Opportune?</h1>
                <p className="text-muted-foreground text-lg">
                    We will personalize your experience based on your choice. Don&apos;t worry, you can always change this later.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                {/* Freelancer Card */}
                <div
                    onClick={() => setSelectedRole("freelancer")}
                    className={cn(
                        "relative p-8 rounded-xl border-2 cursor-pointer transition-all hover:border-primary/50 flex flex-col items-center text-center gap-4 bg-card",
                        selectedRole === "freelancer" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                    )}
                >
                    {selectedRole === "freelancer" && (
                        <div className="absolute top-4 right-4 h-6 w-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                            <Check className="h-4 w-4" />
                        </div>
                    )}
                    <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-2">
                        <User className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold">Freelancer</h3>
                    <p className="text-sm text-muted-foreground">
                        I want to find work, monetize my skills, and participate in contests.
                    </p>
                </div>

                {/* Client Card */}
                <div
                    onClick={() => setSelectedRole("client")}
                    className={cn(
                        "relative p-8 rounded-xl border-2 cursor-pointer transition-all hover:border-primary/50 flex flex-col items-center text-center gap-4 bg-card",
                        selectedRole === "client" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                    )}
                >
                    {selectedRole === "client" && (
                        <div className="absolute top-4 right-4 h-6 w-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                            <Check className="h-4 w-4" />
                        </div>
                    )}
                    <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-2">
                        <Briefcase className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold">Client</h3>
                    <p className="text-sm text-muted-foreground">
                        I want to post projects, hire talent, and host contests.
                    </p>
                </div>

                {/* Both Card */}
                <div
                    onClick={() => setSelectedRole("both")}
                    className={cn(
                        "relative p-8 rounded-xl border-2 cursor-pointer transition-all hover:border-primary/50 flex flex-col items-center text-center gap-4 bg-card",
                        selectedRole === "both" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                    )}
                >
                    {selectedRole === "both" && (
                        <div className="absolute top-4 right-4 h-6 w-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                            <Check className="h-4 w-4" />
                        </div>
                    )}
                    <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mb-2">
                        <Users className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold">Both</h3>
                    <p className="text-sm text-muted-foreground">
                        I want to do it all. Switch between freelancing and hiring anytime.
                    </p>
                </div>
            </div>

            <button
                disabled={!selectedRole || isLoading}
                onClick={handleContinue}
                className="px-8 py-3 bg-foreground text-background rounded-full font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-foreground/90 transition-all flex items-center gap-2"
            >
                {isLoading ? "Saving..." : "Continue"} <ArrowRight className="h-5 w-5" />
            </button>
        </div>
    );
}
