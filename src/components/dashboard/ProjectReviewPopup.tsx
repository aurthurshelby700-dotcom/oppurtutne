"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { X, File, Loader2, Download, CheckCircle2, AlertTriangle, ShieldCheck, Star } from "lucide-react";
import { acceptProjectHandover, disputeProjectHandover } from "@/lib/actions/projectHandovers";
import { submitReview } from "@/lib/actions/reviews";
import { cn } from "@/lib/utils";

interface ProjectReviewPopupProps {
    projectId: string;
    handover: any;
    onClose: () => void;
    onStatusUpdate: () => void;
    ratingMode?: 'freelancer' | 'client';
    clientData?: { clientId: string; clientUsername: string; projectTitle: string; price: number };
}

export function ProjectReviewPopup({ projectId, handover, onClose, onStatusUpdate, ratingMode = 'freelancer', clientData }: ProjectReviewPopupProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmAction, setConfirmAction] = useState<"accept" | "dispute" | null>(null);
    const [showRating, setShowRating] = useState(false);
    const [reviewData, setReviewData] = useState<{ targetId: string; title: string; price: number } | null>(null);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const searchParams = useSearchParams();

    useEffect(() => {
        const action = searchParams.get('action');

        // Freelancer rating client (Manual trigger or URL param)
        if ((action === 'rate-client' || ratingMode === 'client') && handover?.status === 'accepted' && clientData) {
            setReviewData({
                targetId: clientData.clientId,
                title: clientData.projectTitle,
                price: clientData.price
            });
            setShowRating(true);
            return;
        }

        // Client rating freelancer after accepting handover (URL param)
        if (action === 'rate' && handover?.status === 'accepted' && ratingMode === 'freelancer') {
            setReviewData({
                targetId: handover.freelancerId?._id || handover.freelancerId,
                title: handover.projectTitle || "Project",
                price: handover.price || 0
            });
            setShowRating(true);
        }
    }, [searchParams, handover, ratingMode, clientData]);

    const handleAccept = async () => {
        setIsProcessing(true);
        try {
            const result = await acceptProjectHandover(projectId);
            if (result.error) {
                alert(result.error);
                setIsProcessing(false);
            } else {
                onStatusUpdate();
                // Store data for review and show rating screen
                setReviewData({
                    targetId: result.freelancerId!,
                    title: result.projectTitle!,
                    price: result.price!
                });
                setShowRating(true);
                setIsProcessing(false);
            }
        } catch (error) {
            console.error("Error accepting project handover:", error);
            alert("Failed to accept handover");
            setIsProcessing(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewData || rating === 0 || reviewText.length < 10) return;
        setIsProcessing(true);

        await submitReview({
            targetUserId: reviewData.targetId,
            relatedType: "project",
            relatedId: projectId,
            relatedTitle: reviewData.title,
            rating,
            reviewText,
            price: reviewData.price,
            reviewerRole: ratingMode === 'client' ? "freelancer" : "client"
        });

        setIsProcessing(false);
        onStatusUpdate();
        onClose();
    };

    const handleDispute = async () => {
        setIsProcessing(true);
        try {
            const result = await disputeProjectHandover(projectId);
            if (result.error) {
                alert(result.error);
            } else {
                onStatusUpdate();
                onClose();
            }
        } catch (error) {
            console.error("Error disputing project handover:", error);
            alert("Failed to dispute handover");
        } finally {
            setIsProcessing(false);
        }
    };

    if (showRating) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
                <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl scale-in-center">
                    <div className="text-center mb-6">
                        <div className="h-12 w-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
                            <Star className="h-6 w-6 fill-current" />
                        </div>
                        <h2 className="text-xl font-bold">{ratingMode === 'client' ? 'Rate the Client' : 'Rate Your Experience'}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {ratingMode === 'client'
                                ? `How was working with ${clientData?.clientUsername || 'the client'}?`
                                : `How was working on ${reviewData?.title}?`
                            }
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Star Rating */}
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="p-1 hover:scale-110 transition-transform"
                                >
                                    <Star
                                        className={cn(
                                            "h-8 w-8",
                                            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Review Text */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Review (Required)</label>
                            <textarea
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="Describe your experience working on this project..."
                                className="w-full h-32 rounded-xl bg-muted/50 border border-border p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                            />
                            <p className="text-xs text-muted-foreground text-right">{reviewText.length} / 10 chars min</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-muted"
                            >
                                Skip
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                disabled={rating === 0 || reviewText.length < 10 || isProcessing}
                                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                                Submit Rating
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden scale-in-center transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <ShieldCheck className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Review Project Files</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Carefully inspect all deliverables before releasing payment</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors group"
                    >
                        <X className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Status Banner */}
                    <div className={cn(
                        "p-4 rounded-xl border flex items-center gap-4",
                        handover.status === 'disputed'
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-600"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                    )}>
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <div className="text-sm font-medium">
                            {handover.status === 'disputed'
                                ? "This delivery is currently under dispute. Our support team will review it shortly."
                                : "Review the files below. Once you accept, the project budget will be immediately released to the freelancer."}
                        </div>
                    </div>

                    {/* Files Display Grid */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Deliverables List</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {handover.files.map((file: any, index: number) => (
                                <div
                                    key={index}
                                    className="group relative bg-muted/30 border border-border rounded-xl p-4 transition-all duration-200 hover:bg-card hover:shadow-lg hover:border-purple-500/20"
                                >
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-start justify-between">
                                            <div className="p-3 bg-card rounded-xl border border-border text-muted-foreground">
                                                <File className="h-8 w-8" />
                                            </div>
                                            <a
                                                href={file.fileUrl}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-card hover:bg-muted rounded-lg transition-colors text-purple-500 border border-border shadow-sm"
                                                title="Download for Review"
                                            >
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold truncate pr-2">
                                                {file.fileUrl.split('/').pop() || "Deliverable"}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-card border border-border px-1.5 py-0.5 rounded">
                                                    {file.format || 'FILE'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
                    {confirmAction === "accept" ? (
                        <div className="flex items-center gap-4 bg-green-500/5 border border-green-500/20 p-4 rounded-xl animate-in slide-in-from-right-2">
                            <span className="text-sm font-bold text-green-600">Release payment to freelancer?</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    className="px-4 py-2 rounded-lg text-xs font-bold hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAccept}
                                    disabled={isProcessing}
                                    className="px-6 py-2 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors flex items-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                    Confirm & Pay
                                </button>
                            </div>
                        </div>
                    ) : confirmAction === "dispute" ? (
                        <div className="flex items-center gap-4 bg-rose-500/5 border border-rose-500/20 p-4 rounded-xl animate-in slide-in-from-right-2">
                            <span className="text-sm font-bold text-rose-600">Raise a formal dispute?</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    className="px-4 py-2 rounded-lg text-xs font-bold hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDispute}
                                    disabled={isProcessing}
                                    className="px-6 py-2 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors flex items-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                                    Confirm Dispute
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setConfirmAction("dispute")}
                                disabled={handover.status === 'disputed'}
                                className="px-6 py-2.5 rounded-xl border border-border hover:bg-rose-500/10 hover:text-rose-500 transition-all font-bold text-sm disabled:opacity-50"
                            >
                                Raise Dispute
                            </button>
                            <button
                                onClick={() => setConfirmAction("accept")}
                                className="px-8 py-2.5 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-all font-bold text-sm shadow-lg shadow-purple-500/20 flex items-center gap-2"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Accept Files
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
