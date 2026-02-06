"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useSession } from "next-auth/react";
import { Mail, Smartphone, Shield, CreditCard, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getVerificationStatus } from "@/lib/actions/verification";
import { EmailVerificationPopup } from "@/components/verification/EmailVerificationPopup";

interface VerificationState {
    email: boolean;
    mobile: boolean;
    identity: boolean;
    payment: boolean;
}

export default function VerificationPage() {
    const { user, isAuthenticated, isLoading: isUserLoading, refreshUser } = useUser();
    const { update } = useSession();
    const [verification, setVerification] = useState<VerificationState>({
        email: false,
        mobile: false,
        identity: false,
        payment: false
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showEmailPopup, setShowEmailPopup] = useState(false);

    useEffect(() => {
        if (!isUserLoading) {
            loadStatus();
        }
    }, [isUserLoading, user]);

    async function loadStatus() {
        if (!isAuthenticated) {
            setIsLoading(false);
            return;
        }

        try {
            const res = await getVerificationStatus();
            if (res.success && res.verification) {
                setVerification(res.verification);
            }
        } catch (err) {
            console.error("Verification status load error:", err);
        } finally {
            setIsLoading(false);
        }
    }

    const handleEmailVerified = async () => {
        setIsLoading(true);
        try {
            await update();
            await refreshUser();
            await loadStatus();
        } catch (error) {
            console.error("Session update error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const verificationItems = [
        {
            id: "email",
            title: "Email Verification",
            description: "Verify your email address to access all features",
            icon: Mail,
            status: verification.email,
            enabled: true,
            action: () => setShowEmailPopup(true),
            buttonText: "Verify Email"
        },
        {
            id: "mobile",
            title: "Mobile Verification",
            description: "Add and verify your mobile number",
            icon: Smartphone,
            status: verification.mobile,
            enabled: false,
            action: () => { },
            buttonText: "Coming Soon"
        },
        {
            id: "identity",
            title: "Identity Verification",
            description: "Verify your identity with government-issued ID",
            icon: Shield,
            status: verification.identity,
            enabled: false,
            action: () => { },
            buttonText: "Coming Soon"
        },
        {
            id: "payment",
            title: "Payment Verification",
            description: "Add and verify your payment method",
            icon: CreditCard,
            status: verification.payment,
            enabled: false,
            action: () => { },
            buttonText: "Coming Soon"
        }
    ];

    if (isLoading || isUserLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading verification status...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex h-[80vh] items-center justify-center px-6">
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
                    <p className="text-muted-foreground mb-6">Please log in to access the verification system.</p>
                    <a href="/login" className="px-6 py-2 bg-orange-500 text-white rounded-lg font-bold">Log In</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <header className="mb-12">
                    <h1 className="text-4xl font-black tracking-tight mb-4">Verification Center</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Build trust and unlock your full potential on Opportune by verifying your identity and contact methods.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {verificationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.id}
                                className="group relative bg-card border border-border rounded-2xl p-8 hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 overflow-hidden"
                            >
                                {/* Decorative Gradient */}
                                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${item.status ? 'bg-green-500' : 'bg-orange-500'}`} />

                                <div className="relative flex flex-col h-full">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={`p-4 rounded-2xl ${item.status ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}`}>
                                            <Icon className="h-8 w-8" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold">{item.title}</h3>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                {item.status ? (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 uppercase tracking-widest">
                                                        <CheckCircle className="h-3 w-3" /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                        <XCircle className="h-3 w-3" /> Not Verified
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-muted-foreground mb-8 line-clamp-2">
                                        {item.description}
                                    </p>

                                    <div className="mt-auto">
                                        <button
                                            onClick={item.action}
                                            disabled={!item.enabled || item.status}
                                            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all ${item.status
                                                ? "bg-green-500/10 text-green-600 cursor-default"
                                                : item.enabled
                                                    ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-95"
                                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                                                }`}
                                        >
                                            {item.status ? "Verified" : item.buttonText}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <footer className="mt-16 p-8 rounded-2xl bg-muted/30 border border-border">
                    <h3 className="font-bold text-lg mb-4">Why verification matters?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            "Unlock active bidding on projects",
                            "Participate in high-value contests",
                            "Higher ranking in search results",
                            "Enhanced security for payments"
                        ].map((text, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-orange-500" />
                                {text}
                            </div>
                        ))}
                    </div>
                </footer>
            </div>

            {showEmailPopup && user?.email && (
                <EmailVerificationPopup
                    userEmail={user.email}
                    onClose={() => {
                        setShowEmailPopup(false);
                        loadStatus();
                        refreshUser();
                    }}
                    onVerified={handleEmailVerified}
                />
            )}
        </div>
    );
}
