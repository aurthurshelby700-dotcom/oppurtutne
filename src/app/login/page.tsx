"use client";

import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/actions/auth";

export default function LoginPage() {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(loginUser, undefined);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative p-4">
            {/* Centered Login Card */}
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-primary-foreground font-bold text-2xl">O</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Enter your credentials to access your workspace.
                    </p>
                </div>

                <form action={formAction} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none" htmlFor="email">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="m@example.com"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium leading-none" htmlFor="password">
                                Password
                            </label>
                            <Link href="#" className="text-xs text-primary hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>

                    {state && (
                        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded">
                            {state}
                        </div>
                    )}

                    <button
                        disabled={isPending}
                        type="submit"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                        {isPending ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>

            {/* Signup Button - Bottom Right */}
            <div className="absolute bottom-8 right-8">
                <Link
                    href="/signup"
                    className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors border border-border bg-card px-4 py-2 rounded-lg hover:border-primary/50"
                >
                    Don&apos;t have an account? <span className="text-primary ml-1">Sign up</span>
                </Link>
            </div>
        </div>
    );
}
