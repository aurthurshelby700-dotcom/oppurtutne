import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { X, File, Download, CheckCircle, Loader2, AlertCircle, ShieldAlert, Star } from "lucide-react";
import { acceptHandover, disputeHandover } from "@/lib/actions/handovers";
import { submitReview } from "@/lib/actions/reviews";
import { cn } from "@/lib/utils";

interface HandoverReviewPopupProps {
    contestId: string;
    handover: any;
    onClose: () => void;
    onAccept: () => void;
    ratingMode?: 'freelancer' | 'client';
    clientData?: { clientId: string; clientUsername: string; contestTitle: string; price: number };
}

export function HandoverReviewPopup({ contestId, handover, onClose, onAccept, ratingMode = 'freelancer', clientData }: HandoverReviewPopupProps) {
    const [confirmationType, setConfirmationType] = useState<"accept" | "dispute" | null>(null);
    const [isLoading, setIsLoading] = useState(false);
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
                title: clientData.contestTitle,
                price: clientData.price
            });
            setShowRating(true);
            return;
        }

        // Client rating freelancer after accepting handover (URL param)
        if (action === 'rate' && handover?.status === 'accepted' && ratingMode === 'freelancer') {
            setReviewData({
                targetId: handover.freelancerId?._id || handover.freelancerId,
                title: handover.contestTitle || "Contest",
                price: handover.price || 0
            });
            setShowRating(true);
        }
    }, [searchParams, handover, ratingMode, clientData]);

    const handleAction = async () => {
        if (!confirmationType) return;
        setIsLoading(true);

        try {
            const result = confirmationType === "accept"
                ? await acceptHandover(contestId)
                : await disputeHandover(contestId);

            if (result.error) {
                alert(result.error);
                setIsLoading(false);
            } else {
                if (confirmationType === "accept") {
                    onAccept();
                    setReviewData({
                        targetId: (result as any).freelancerId,
                        title: (result as any).contestTitle,
                        price: (result as any).price
                    });
                    setShowRating(true);
                    setConfirmationType(null); // Close confirmation modal, open rating view
                    setIsLoading(false);
                } else {
                    onClose();
                    setIsLoading(false);
                }
            }
        } catch (error) {
            console.error(`Error ${confirmationType}ing handover:`, error);
            alert(`Failed to ${confirmationType} handover`);
            setIsLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewData || rating === 0 || reviewText.length < 10) return;
        setIsLoading(true);

        await submitReview({
            targetUserId: reviewData.targetId,
            relatedType: "contest",
            relatedId: contestId,
            relatedTitle: reviewData.title,
            rating,
            reviewText,
            price: reviewData.price,
            reviewerRole: ratingMode === 'client' ? "freelancer" : "client"
        });

        setIsLoading(false);
        onAccept();
        onClose();
    };

    const isAccepted = handover?.status === "accepted";
    const isDisputed = handover?.status === "disputed";

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
                                placeholder="Describe your experience working on this contest..."
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
                                disabled={rating === 0 || reviewText.length < 10 || isLoading}
                                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
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
                        <div className={cn(
                            "p-2 rounded-lg",
                            isAccepted ? "bg-green-500/10 text-green-500" :
                                isDisputed ? "bg-rose-500/10 text-rose-500" : "bg-orange-500/10 text-orange-500"
                        )}>
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Review Handover</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isAccepted ? "Handover accepted and payment released" :
                                    isDisputed ? "Handover is currently under dispute" :
                                        "Review final deliverables before releasing payment"}
                            </p>
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
                    {/* Status Notice */}
                    {!isAccepted && !isDisputed && (
                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex items-start gap-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                                <AlertCircle className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-blue-700">Client Review Required</p>
                                <p className="text-xs text-blue-600/80 leading-relaxed">
                                    Please examine all files carefully. By clicking "Accept Files", you authorize the immediate release of the contest prize to the freelancer. This action is irreversible.
                                </p>
                            </div>
                        </div>
                    )}

                    {isDisputed && (
                        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 flex items-start gap-4">
                            <div className="p-2 bg-rose-500/10 rounded-lg shrink-0">
                                <ShieldAlert className="h-5 w-5 text-rose-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-rose-700">Handover Disputed</p>
                                <p className="text-xs text-rose-600/80 leading-relaxed">
                                    You have raised a dispute on these deliverables. Our arbitration team will review the submission and contact both parties shortly.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Files Display Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                                Deliverables ({handover?.files?.length || 0})
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {handover?.files?.map((file: any, index: number) => (
                                <div
                                    key={index}
                                    className="group relative bg-card border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-lg"
                                >
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-start justify-between">
                                            <div className="p-3 bg-muted rounded-xl text-muted-foreground">
                                                <File className="h-8 w-8 text-orange-500" />
                                            </div>
                                            <a
                                                href={file.fileUrl}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                                title="Download File"
                                            >
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold truncate pr-2" title={file.fileUrl.split('/').pop()}>
                                                {file.fileUrl.split('/').pop() || `File ${index + 1}`}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                    {file.format || file.fileUrl.split('.').pop()?.toUpperCase() || 'FILE'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground max-w-sm">
                        {isAccepted ? "Finalized on " + (handover.acceptedAt ? new Date(handover.acceptedAt).toLocaleDateString() : 'N/A') :
                            "Verify all deliverables before finalizing the contest."}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-border hover:bg-muted transition-all font-bold text-sm"
                        >
                            {isAccepted || isDisputed ? "Close" : "Cancel"}
                        </button>

                        {!isAccepted && !isDisputed && (
                            <>
                                <button
                                    onClick={() => setConfirmationType("dispute")}
                                    className="px-6 py-2.5 rounded-xl border border-rose-500/50 text-rose-500 hover:bg-rose-500/10 transition-all font-bold text-sm"
                                >
                                    Raise Dispute
                                </button>
                                <button
                                    onClick={() => setConfirmationType("accept")}
                                    className="px-8 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all font-bold text-sm flex items-center gap-2 shadow-lg shadow-green-600/20 active:scale-95"
                                >
                                    Accept Files
                                    <CheckCircle className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Overlay */}
            {confirmationType && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-card border border-border rounded-2xl p-8 max-w-md shadow-2xl space-y-6">
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center mx-auto",
                            confirmationType === "accept" ? "bg-green-500/10 text-green-500" : "bg-rose-500/10 text-rose-500"
                        )}>
                            {confirmationType === "accept" ? <CheckCircle className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold">
                                {confirmationType === "accept" ? "Confirm Acceptance" : "Raise Dispute?"}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {confirmationType === "accept"
                                    ? "Are you sure you want to accept these deliverables? This will immediately release the prize money to the freelancer."
                                    : "Are you sure you want to raise a dispute? This will freeze the payment release and alert our support team for review."}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmationType(null)}
                                className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-all font-bold text-sm"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={isLoading}
                                className={cn(
                                    "flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95",
                                    confirmationType === "accept" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                                )}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                    confirmationType === "accept" ? "Confirm Accept" : "Confirm Dispute"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
