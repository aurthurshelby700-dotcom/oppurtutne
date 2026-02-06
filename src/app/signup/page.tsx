"use client";

import { Check, Mail, Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { signIn } from "next-auth/react";

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // Debounce username check
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.username.length >= 3) {
                setUsernameStatus('checking');
                try {
                    const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(formData.username)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setUsernameStatus(data.available ? 'available' : 'taken');
                    } else {
                        setUsernameStatus('idle'); // Network error silently ignored or handle better?
                    }
                } catch (err) {
                    console.error(err);
                    setUsernameStatus('idle');
                }
            } else {
                setUsernameStatus('idle');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.username]);

    // Password validation on change
    useEffect(() => {
        if (formData.password && formData.confirmPassword) {
            if (formData.password !== formData.confirmPassword) {
                setPasswordError("Passwords do not match");
            } else {
                setPasswordError(null);
            }
        } else {
            setPasswordError(null);
        }
    }, [formData.password, formData.confirmPassword]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        let newValue = value;
        if (name === "username") {
            // Lowercase and remove spaces/special chars (keep alphanumeric + underscore)
            newValue = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
        }

        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (usernameStatus === 'taken') {
            setError("Please choose a different username");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Step 1: Register the user
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            setSuccessMessage("Account created! Logging you in...");

            // Step 2: Automatically sign in the user to establish session
            const signInResult = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false
            });

            if (signInResult?.error) {
                throw new Error("Account created but login failed. Please try logging in manually.");
            }

            // Step 3: Redirect to setup profile
            setSuccessMessage("Success! Redirecting to profile setup...");
            setTimeout(() => {
                router.push("/setup-profile");
                router.refresh(); // Refresh to update session state
            }, 1000);

        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    const isSubmitDisabled =
        isLoading ||
        !formData.firstName ||
        !formData.lastName ||
        !formData.username ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword ||
        usernameStatus === 'taken' ||
        usernameStatus === 'checking' ||
        !!passwordError;

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
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="firstName">First Name</label>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                required
                                minLength={2}
                                value={formData.firstName}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="John"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="lastName">Last Name</label>
                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                required
                                minLength={1}
                                value={formData.lastName}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm font-medium" htmlFor="username">Username</label>
                            {usernameStatus === 'checking' && <span className="text-xs text-muted-foreground flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Checking...</span>}
                            {usernameStatus === 'available' && <span className="text-xs text-green-600 flex items-center"><Check className="w-3 h-3 mr-1" /> Available</span>}
                            {usernameStatus === 'taken' && <span className="text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Taken</span>}
                        </div>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className={cn(
                                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                    usernameStatus === 'taken' && "border-red-500 focus-visible:ring-red-500",
                                    usernameStatus === 'available' && "border-green-500 focus-visible:ring-green-500"
                                )}
                                placeholder="johndoe"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="email">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="password">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={8}
                                value={formData.password}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="••••••••"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Min. 8 chars, 1 letter & 1 number</p>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="confirmPassword">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={cn(
                                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                    passwordError && "border-red-500 focus-visible:ring-red-500"
                                )}
                                placeholder="••••••••"
                            />
                        </div>
                        {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="text-sm text-green-500 bg-green-50 dark:bg-green-900/10 p-2 rounded flex items-center">
                            <Check className="w-4 h-4 mr-2" />
                            {successMessage}
                        </div>
                    )}

                    <button
                        disabled={isSubmitDisabled}
                        type="submit"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Account...
                            </span>
                        ) : (
                            "Create Account"
                        )}
                    </button>

                    <div className="mt-4 text-center">
                        <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            Already have an account? Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
