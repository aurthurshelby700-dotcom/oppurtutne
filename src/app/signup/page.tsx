"use client";

import { Check, Mail, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { registerUser } from "@/lib/actions/auth";

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const result = await registerUser(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            // Success - redirect handled by client or middleware after session update
            // Explicitly push to onboarding or refresh to let middleware handle it
            router.refresh();
            // We can push to root, middleware will catch pending role and redirect to /onboarding
            router.push("/");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background max-w-5xl mx-auto">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Join Opportune today
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="email">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="password">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <button
                        disabled={isLoading}
                        type="submit"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                        {isLoading ? "Creating Account..." : "Sign Up"}
                    </button>

                    <div className="mt-4 text-center">
                        <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
                            Already have an account? Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
