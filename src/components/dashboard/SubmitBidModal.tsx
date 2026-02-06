"use client";

import { useState } from "react";
import { X, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { submitBid } from "@/lib/actions/bids";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SubmitBidModalProps {
    project: any;
    user: any;
    onClose: () => void;
    onSuccess: () => void;
}

export function SubmitBidModal({ project, user, onClose, onSuccess }: SubmitBidModalProps) {
    const [bidAmount, setBidAmount] = useState<number | "">("");
    const [days, setDays] = useState<number | "">("");
    const [proposal, setProposal] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const isEmailVerified = user?.verification?.email || user?.emailVerified;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEmailVerified) return;

        if (!bidAmount || !days || !proposal) {
            setError("All fields are required");
            return;
        }

        if (Number(bidAmount) < project.budgetMin || Number(bidAmount) > project.budgetMax) {
            setError(`Bid must be between $${project.budgetMin} and $${project.budgetMax}`);
            return;
        }

        if (proposal.length < 50) {
            setError("Proposal must be at least 50 characters long");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const result = await submitBid({
                projectId: project._id,
                bidAmount: Number(bidAmount),
                days: Number(days),
                proposal: proposal.trim(),
            });

            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.error || "Failed to submit proposal");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold">Submit Your Proposal</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {!isEmailVerified ? (
                    <div className="p-12 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-10 w-10 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold">Email Verification Required</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            You must verify your email address before you can submit proposals on Opportune.
                        </p>
                        <div className="pt-4 flex items-center justify-center gap-3">
                            <button
                                className="px-6 py-2.5 bg-muted text-muted-foreground rounded-xl font-bold hover:bg-muted/80 transition-all"
                                onClick={onClose}
                            >
                                Got it
                            </button>
                            <Link
                                href="/verification"
                                className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                                onClick={onClose}
                            >
                                Verify Now
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm font-medium border border-destructive/20">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-foreground">Bid Amount ($)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                                    <input
                                        type="number"
                                        required
                                        min={project.budgetMin}
                                        max={project.budgetMax}
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(Number(e.target.value))}
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all font-medium"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground px-1">Must be between ${project.budgetMin} and ${project.budgetMax}.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-foreground">Delivery Time (Days)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        value={days}
                                        onChange={(e) => setDays(Number(e.target.value))}
                                        placeholder="e.g. 7"
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all font-medium"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground px-1">How many days will it take you to complete?</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground flex justify-between">
                                Proposal Details
                                <span className={cn(
                                    "text-[10px]",
                                    proposal.length < 50 ? "text-amber-600" : "text-green-600"
                                )}>
                                    {proposal.length} / 50 characters min
                                </span>
                            </label>
                            <textarea
                                required
                                value={proposal}
                                onChange={(e) => setProposal(e.target.value)}
                                placeholder="Explain why you are the best fit for this project. Mention your experience, approach and any questions you have."
                                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all min-h-[160px] text-sm leading-relaxed"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || proposal.length < 50}
                                className="px-8 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-lg flex items-center gap-2"
                            >
                                {isSubmitting ? "Submitting..." : (
                                    <>
                                        Submit Proposal
                                        <CheckCircle2 className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
