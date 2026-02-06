"use client";

import { useState, useEffect } from "react";
import { useScrollAware } from "@/hooks/useScrollAware";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/date";
import { Clock, Trophy, MapPin, Share2, Upload, CheckCircle, DollarSign, Star, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Search, MessageCircle, Send, ThumbsDown, AlertTriangle, Heart, Download, MessageSquare, FileText, AlertCircle, Layers, Film } from "lucide-react";
import { submitEntry, getContestEntries, rateEntry, rejectEntry, awardEntry, unrejectEntry } from "@/lib/actions/entries";
import { getEntryComments, postEntryComment } from "@/lib/actions/comments";
import Link from "next/link";
import FileUploader from "@/components/ui/FileUploader";
import { useUser } from "@/context/UserContext";

import { EntryCard } from "./EntryCard";
import { SubmitEntryModal } from "./SubmitEntryModal";
import { BookmarkButton } from "@/components/shared/BookmarkButton";
import { AgreementSignPopup } from "./AgreementSignPopup";
import { HandoverUploadPopup } from "./HandoverUploadPopup";
import { HandoverReviewPopup } from "./HandoverReviewPopup";
import { getAgreement } from "@/lib/actions/agreements";
import { getHandover } from "@/lib/actions/handovers";
import { useSearchParams } from "next/navigation";

interface ContestDetailViewProps {
    contest: any;
    similarContests: any[];
    isSaved: boolean;
}

export function ContestDetailView({ contest, similarContests, isSaved }: ContestDetailViewProps) {
    // Scroll Awareness
    const centerPanel = useScrollAware(3000);
    const rightPanel = useScrollAware(3000);
    // ... logic ...
    const { user } = useUser();

    const [activeSection, setActiveSection] = useState<"Details" | "Entries">("Details");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entries, setEntries] = useState<any[]>([]);
    const [showSubmissionForm, setShowSubmissionForm] = useState(false);
    const [submissionFile, setSubmissionFile] = useState<{ url: string, format: string } | null>(null);
    const [submissionDesc, setSubmissionDesc] = useState("");
    const [error, setError] = useState("");

    // Filter & Sort State
    const [filter, setFilter] = useState<"all" | "my" | "rejected">("all");
    const [sortBy, setSortBy] = useState<"default" | "newest">("default");
    const [showVerifyNotice, setShowVerifyNotice] = useState(false);

    // Confirmation State
    const [confirmationAction, setConfirmationAction] = useState<{ type: 'award' | 'reject' | 'unreject', entryId: string } | null>(null);

    const [selectedEntry, setSelectedEntry] = useState<any>(null); // State for modal view
    const [zoomLevel, setZoomLevel] = useState(1); // State for zoom scale
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState("");
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [activeFileIndex, setActiveFileIndex] = useState(0);

    // Agreement & Handover State
    const [agreement, setAgreement] = useState<any>(null);
    const [handover, setHandover] = useState<any>(null);
    const [showAgreementPopup, setShowAgreementPopup] = useState(false);
    const [showHandoverUploadPopup, setShowHandoverUploadPopup] = useState(false);
    const [showHandoverReviewPopup, setShowHandoverReviewPopup] = useState(false);
    const [ratingMode, setRatingMode] = useState<'freelancer' | 'client'>('freelancer');
    const searchParams = useSearchParams();

    useEffect(() => {
        if (activeSection === "Entries") {
            loadEntries();
        }
    }, [activeSection, contest._id]);

    // Fetch agreement and handover data
    useEffect(() => {
        const fetchAgreementAndHandover = async () => {
            const [agreementRes, handoverRes] = await Promise.all([
                getAgreement(contest._id),
                getHandover(contest._id)
            ]);
            if (agreementRes.success) setAgreement(agreementRes.agreement);
            if (handoverRes.success) setHandover(handoverRes.handover);
        };
        fetchAgreementAndHandover();
    }, [contest._id]);

    // Handle deep-linking from notifications
    useEffect(() => {
        const action = searchParams?.get('action');
        if (action === 'sign-agreement') {
            setShowAgreementPopup(true);
        } else if (action === 'handover-upload') {
            setShowHandoverUploadPopup(true);
        } else if (action === 'handover-review') {
            setShowHandoverReviewPopup(true);
        } else if (action === 'rate') {
            setRatingMode('freelancer');
            setShowHandoverReviewPopup(true);
        } else if (action === 'rate-client') {
            setRatingMode('client');
            setShowHandoverReviewPopup(true);
        }
    }, [searchParams]);

    const loadEntries = async () => {
        const data = await getContestEntries(contest._id);
        setEntries(data);
    };

    const handleUploadSuccess = (url: string, result: any) => {
        setSubmissionFile({
            url,
            format: result.format?.toUpperCase() || "UNKNOWN"
        });
        setError("");
    };

    const handleSubmitSuccess = () => {
        loadEntries();
        setShowSubmissionForm(false);
    };

    const handleRateEntry = async (entryId: string, rating: number) => {
        // Optimistic update
        setEntries(prev => prev.map(e => e._id === entryId ? { ...e, rating } : e));

        // Also update selectedEntry if it's the one being rated
        if (selectedEntry && selectedEntry._id === entryId) {
            setSelectedEntry((prev: any) => ({ ...prev, rating }));
        }

        try {
            const result = await rateEntry(entryId, rating);
            if (result.error) {
                console.error("Rate entry failed:", result.error);
                // Revert on error
                setEntries(prev => prev.map(e => e._id === entryId ? { ...e, rating: e.rating } : e));
                if (selectedEntry && selectedEntry._id === entryId) {
                    // Revert selected entry too - tricky without prev state, just sync with entries
                }
                alert(`Failed to rate: ${result.error}`);
            } else {
                console.log("Rate entry success");
            }
        } catch (err) {
            console.error("Rate entry exception:", err);
            // Revert on error
            setEntries(prev => prev.map(e => e._id === entryId ? { ...e, rating: 0 } : e));
        }
    };

    // Fetch comments when entry is selected
    useEffect(() => {
        if (selectedEntry) {
            setActiveFileIndex(0);
            setZoomLevel(1);
            setIsLoadingComments(true);
            getEntryComments(selectedEntry._id).then(data => {
                setComments(data);
                setIsLoadingComments(false);
            });
        }
    }, [selectedEntry]);

    const handlePostComment = async () => {
        if (!commentText.trim() || !selectedEntry) return;

        const content = commentText;
        setCommentText(""); // Optimistic clear

        const newComment = await postEntryComment(selectedEntry._id, content);
        if (newComment && !newComment.error) {
            // Optimistic add with current user data for immediate feedback
            const optimisitcComment = {
                ...newComment,
                authorId: {
                    _id: user?.id,
                    username: user?.username,
                    avatarUrl: user?.avatarUrl
                }
            };
            setComments(prev => [...prev, optimisitcComment]);
        }
    };

    const handleConfirmAction = async () => {
        if (!confirmationAction) return;

        const { type, entryId } = confirmationAction;
        setConfirmationAction(null); // Close modal immediately

        console.log(`[DEBUG] Confirming ${type} for entry ${entryId}`);

        // Optimistic UI Update for immediate feedback
        if (selectedEntry && selectedEntry._id === entryId) {
            const newStatus = type === 'reject' ? 'rejected' : type === 'award' ? 'awarded' : 'active';
            console.log(`[DEBUG] Optimistic update: ${selectedEntry.status} -> ${newStatus}`);
            setSelectedEntry({ ...selectedEntry, status: newStatus });
        }

        // Update server
        if (type === 'reject') {
            await rejectEntry(entryId);
        } else if (type === 'award') {
            const result = await awardEntry(contest._id, entryId);
            // Show agreement popup for client after awarding
            if (result.showAgreementPopup) {
                setShowAgreementPopup(true);
            }
        } else if (type === 'unreject') {
            await unrejectEntry(entryId);
        }

        // Re-fetch to ensure local state matches server persistence
        const updatedEntries = await getContestEntries(contest._id);
        console.log(`[DEBUG] Fetched ${updatedEntries.length} entries from server`);
        setEntries(updatedEntries);

        // Update selected entry view with server data
        const updatedSelected = updatedEntries.find((e: any) => e._id === entryId);
        console.log(`[DEBUG] Updated entry status from server:`, updatedSelected?.status);
        if (updatedSelected) setSelectedEntry(updatedSelected);

        // Refresh agreement/handover data
        const [agreementRes, handoverRes] = await Promise.all([
            getAgreement(contest._id),
            getHandover(contest._id)
        ]);
        if (agreementRes.success) setAgreement(agreementRes.agreement);
        if (handoverRes.success) setHandover(handoverRes.handover);
    };

    const handlePrevEntry = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedEntry || entries.length === 0) return;
        setZoomLevel(1); // Reset zoom on nav
        const currentIndex = entries.findIndex(entry => entry._id === selectedEntry._id);
        const prevIndex = (currentIndex - 1 + entries.length) % entries.length;
        setSelectedEntry(entries[prevIndex]);
    };

    const handleNextEntry = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedEntry || entries.length === 0) return;
        setZoomLevel(1); // Reset zoom on nav
        const currentIndex = entries.findIndex(entry => entry._id === selectedEntry._id);
        const nextIndex = (currentIndex + 1) % entries.length;
        setSelectedEntry(entries[nextIndex]);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedEntry) return;
            if (e.key === "ArrowLeft") {
                setZoomLevel(1);
                const currentIndex = entries.findIndex(entry => entry._id === selectedEntry._id);
                const prevIndex = (currentIndex - 1 + entries.length) % entries.length;
                setSelectedEntry(entries[prevIndex]);
            } else if (e.key === "ArrowRight") {
                setZoomLevel(1);
                const currentIndex = entries.findIndex(entry => entry._id === selectedEntry._id);
                const nextIndex = (currentIndex + 1) % entries.length;
                setSelectedEntry(entries[nextIndex]);
            } else if (e.key === "Escape") {
                setSelectedEntry(null);
                setZoomLevel(1);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedEntry, entries]);

    if (!contest) return <div>Contest not found</div>;

    const client = contest.createdBy || {};
    const isOwner = user?.id && (user.id === contest.createdBy || user.id === contest.createdBy?._id);

    // Check if current user is the awarded freelancer
    const awardedEntry = entries.find((e: any) => e.status === 'awarded');
    const isAwardedFreelancer = awardedEntry && user?.id && awardedEntry.freelancerId?._id === user.id;

    return (
        <div className="h-full bg-background overflow-y-auto pb-20">
            {/* Verification Notice */}
            {user && !user.verification?.email && (
                <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <p className="text-sm font-medium text-orange-600">
                            Please verify your email to submit entries to this contest.
                        </p>
                    </div>
                    <Link
                        href="/verification"
                        className="text-xs font-bold text-orange-600 hover:bg-orange-600 hover:text-white px-3 py-1 rounded-full border border-orange-500/30 transition-all"
                    >
                        Verify Now
                    </Link>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-card border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                                {contest.title}
                            </h1>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                handover?.status === 'accepted'
                                    ? "bg-zinc-100 text-zinc-900 border-zinc-200"
                                    : awardedEntry
                                        ? "bg-orange-500 text-white border-orange-400"
                                        : "bg-green-500/10 text-green-600 border-green-500/20"
                            )}>
                                {handover?.status === 'accepted' ? "CLOSED" : awardedEntry ? "AWARDED" : "OPEN"}
                            </span>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-2">
                                <button className="p-2.5 hover:bg-muted rounded-full transition-colors border border-border text-muted-foreground hover:text-foreground">
                                    <Share2 className="h-5 w-5" />
                                </button>
                                <BookmarkButton
                                    itemId={contest._id}
                                    itemType="contest"
                                    initialSavedState={isSaved}
                                    activeColor="text-amber-500"
                                    className="p-2.5 hover:bg-muted border border-border text-muted-foreground hover:text-foreground rounded-full"
                                />
                                <div className="bg-muted px-6 py-2 rounded-xl border border-border ml-2 flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prize Amount</span>
                                    <span className="text-2xl font-black text-amber-600">${contest.prize}</span>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-2">
                                {timeAgo(contest.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* Freelancer Action Buttons (for awarded freelancer only) */}
                    {isAwardedFreelancer && (
                        <div className="flex items-center gap-2 mt-2">
                            <button
                                onClick={() => setShowAgreementPopup(true)}
                                disabled={agreement?.freelancerSigned}
                                className={cn(
                                    "px-4 py-2 rounded-lg font-bold text-sm transition-all border",
                                    agreement?.freelancerSigned
                                        ? "bg-green-500/10 text-green-600 border-green-500/20 cursor-not-allowed"
                                        : "bg-orange-500 text-white hover:bg-orange-600 border-orange-500"
                                )}
                            >
                                {agreement?.freelancerSigned ? "✓ Agreement Signed" : "Sign Agreement"}
                            </button>
                            <button
                                onClick={() => setShowHandoverUploadPopup(true)}
                                disabled={!agreement?.freelancerSigned || handover?.status === 'accepted'}
                                className={cn(
                                    "px-4 py-2 rounded-lg font-bold text-sm transition-all border",
                                    handover?.status === 'accepted'
                                        ? "bg-green-500/10 text-green-600 border-green-500/20 cursor-not-allowed"
                                        : !agreement?.freelancerSigned
                                            ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                                            : "bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
                                )}
                            >
                                {handover?.status === 'accepted' ? "✓ Handover Submitted" : "Handover"}
                            </button>

                            {/* Freelancer Rate Client Button */}
                            {handover?.status === 'accepted' && (
                                <button
                                    onClick={() => {
                                        setRatingMode('client');
                                        setShowHandoverReviewPopup(true);
                                    }}
                                    disabled={handover?.freelancerHasRated}
                                    className={cn(
                                        "px-4 py-2 rounded-lg font-bold text-sm transition-all border shadow-lg",
                                        handover?.freelancerHasRated
                                            ? "bg-green-500/10 text-green-600 border-green-500/20 cursor-not-allowed"
                                            : "bg-orange-500 text-white hover:bg-orange-600 border-orange-500 active:scale-95"
                                    )}
                                >
                                    {handover?.freelancerHasRated ? "✓ Rated" : "Rate Client"}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Client Handover Review Button */}
                    {isOwner && handover && (
                        <div className="flex items-center gap-2 mt-2">
                            <button
                                onClick={() => setShowHandoverReviewPopup(true)}
                                className={cn(
                                    "px-4 py-2 rounded-lg font-bold text-sm transition-all border",
                                    handover.status === 'accepted'
                                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                                        : "bg-orange-500 text-white hover:bg-orange-600 border-orange-500"
                                )}
                            >
                                {handover.status === 'accepted' ? "✓ Handover Accepted" : "Review Handover"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
                    {/* LEFT CONTENT (70%) */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                        {/* TABS */}
                        <div className="flex border-b border-border gap-8">
                            {["Details", "Entries"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveSection(tab as any)}
                                    className={cn(
                                        "pb-4 text-sm font-bold transition-all relative",
                                        activeSection === tab
                                            ? "text-orange-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-orange-500"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {tab === "Entries" ? `Entries (${entries.length})` : tab}
                                </button>
                            ))}
                        </div>

                        {activeSection === "Details" ? (
                            <div className="space-y-8">
                                {/* Description Card */}
                                <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
                                    <h3 className="text-xl font-black text-foreground mb-6 flex items-center gap-3">
                                        <FileText className="h-6 w-6 text-orange-500" />
                                        Project Description
                                    </h3>
                                    <div className="prose prose-stone dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {contest.description}
                                    </div>
                                </div>

                                {/* Allowed Formats & Skills */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Allowed Deliverable Formats</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {contest.deliverableFormats?.length > 0 ? (
                                                contest.deliverableFormats.map((f: string) => (
                                                    <span key={f} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest border border-white/5 shadow-sm">
                                                        {f}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">No specific formats specified</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Skills Required</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {contest.skills?.map((s: string) => (
                                                <span key={s} className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-bold border border-orange-500/20">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-400">
                                <div className="flex flex-col items-end gap-3">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-xl font-bold">Entries</h3>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={filter}
                                                onChange={(e) => setFilter(e.target.value as any)}
                                                className="bg-background border border-border rounded-lg px-3 py-1 text-xs font-bold outline-none focus:border-orange-500"
                                            >
                                                <option value="all">All Entries</option>
                                                <option value="my">My Entries</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value as any)}
                                                className="bg-background border border-border rounded-lg px-3 py-1 text-xs font-bold outline-none focus:border-orange-500"
                                            >
                                                <option value="default">Premium View (Rated)</option>
                                                <option value="newest">Latest First</option>
                                            </select>
                                        </div>
                                    </div>
                                    {!isOwner && contest.status === 'open' && (
                                        <div className="flex flex-col items-end gap-3">
                                            <button
                                                onClick={() => {
                                                    if (!user?.verification?.email) {
                                                        setShowVerifyNotice(true);
                                                    } else {
                                                        setShowSubmissionForm(true);
                                                    }
                                                }}
                                                className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-all shadow-md"
                                            >
                                                Submit Entry
                                            </button>
                                            {showVerifyNotice && !user?.verification?.email && (
                                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 animate-in slide-in-from-top-2 duration-300">
                                                    <div className="flex flex-col gap-2">
                                                        <p className="text-sm font-bold flex items-center gap-2">
                                                            <AlertCircle className="h-4 w-4" />
                                                            Verify your email to submit an entry
                                                        </p>
                                                        <Link
                                                            href="/verification"
                                                            className="text-xs font-black uppercase tracking-widest bg-amber-200/50 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors inline-block w-fit"
                                                        >
                                                            Go to Verification
                                                        </Link>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {(() => {
                                        let filtered = entries.filter(e => {
                                            if (filter === "my") return e.freelancerId?._id === user?.id;
                                            if (filter === "rejected") return e.status === "rejected";
                                            return true;
                                        });

                                        filtered.sort((a, b) => {
                                            if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                                            if (a.status === 'awarded') return -1;
                                            if (b.status === 'awarded') return 1;
                                            return (b.rating || 0) - (a.rating || 0);
                                        });

                                        if (filtered.length === 0) {
                                            return (
                                                <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-2xl bg-muted/20">
                                                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                                    <p className="text-muted-foreground font-medium">No entries yet. Be the first!</p>
                                                </div>
                                            );
                                        }

                                        return filtered.map(entry => (
                                            <EntryCard
                                                key={entry._id}
                                                entry={entry}
                                                isOwner={isOwner}
                                                onAward={() => setConfirmationAction({ type: 'award', entryId: entry._id })}
                                                onReject={() => setConfirmationAction({ type: 'reject', entryId: entry._id })}
                                                onClick={() => setSelectedEntry(entry)}
                                            />
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL (30%) */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sticky top-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Contest Holder</h3>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 border-2 border-border shadow-sm">
                                        {client.profileImageUrl || client.avatarUrl ? (
                                            <img src={client.profileImageUrl || client.avatarUrl} alt={client.username} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-lg font-black uppercase">
                                                {client.username?.slice(0, 2)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-black text-lg text-foreground truncate">{client.username || "Client"}</div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" /> {client.location || "Remote"}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 pt-4 border-t border-border">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-medium">Rating</span>
                                        <span className="font-black text-foreground flex items-center gap-1">
                                            ⭐ {client.rating || 0} ({client.reviewsCount || 0})
                                        </span>
                                    </div>

                                    {/* Verification Badges */}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {client.identityVerified && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 text-green-600 text-[10px] font-bold border border-green-500/20">
                                                <CheckCircle className="h-3 w-3" /> Identity
                                            </span>
                                        )}
                                        {client.paymentVerified && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[10px] font-bold border border-blue-500/20">
                                                <DollarSign className="h-3 w-3" /> Payment
                                            </span>
                                        )}
                                        {client.emailVerified && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[10px] font-bold border border-amber-500/20">
                                                <CheckCircle className="h-3 w-3" /> Email
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => window.location.href = `/profile/${client.username}`}
                                    className="w-full py-2.5 rounded-lg text-xs font-black bg-secondary text-secondary-foreground hover:bg-muted transition-colors uppercase tracking-widest border border-border"
                                >
                                    View Full Profile
                                </button>
                            </div>

                            {/* Similar Contests - Minor Sidebar Item */}
                            {similarContests?.length > 0 && (
                                <div className="mt-10 pt-10 border-t border-border">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Similar Contests</h3>
                                    <div className="space-y-4">
                                        {similarContests.slice(0, 3).map((c) => (
                                            <div key={c._id} className="group cursor-pointer">
                                                <div className="font-bold text-xs group-hover:text-amber-600 transition-colors line-clamp-1">{c.title}</div>
                                                <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                                                    <span className="font-bold text-foreground">${c.prize}</span>
                                                    <span>Open</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {
                showSubmissionForm && (
                    <SubmitEntryModal
                        contest={contest}
                        user={user}
                        onClose={() => setShowSubmissionForm(false)}
                        onSuccess={handleSubmitSuccess}
                    />
                )
            }

            {
                selectedEntry && (
                    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => { setSelectedEntry(null); setZoomLevel(1); }}>

                        {/* Navigation Buttons */}
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            onClick={handlePrevEntry}
                        >
                            <ChevronLeft className="h-10 w-10" />
                        </button>

                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            onClick={handleNextEntry}
                        >
                            <ChevronRight className="h-10 w-10" />
                        </button>

                        {/* Main Modal Card - Flex Row Layout */}
                        <div className="relative w-full max-w-7xl h-[85vh] bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-row" onClick={e => e.stopPropagation()}>

                            {/* Close Button - Absolute to Card */}
                            <button
                                onClick={() => { setSelectedEntry(null); setZoomLevel(1); }}
                                className="absolute top-4 right-4 z-[60] p-2 text-white/70 hover:text-white hover:bg-black/50 transition-all rounded-full bg-black/20 backdrop-blur-sm"
                            >
                                <X className="h-6 w-6" />
                            </button>

                            {/* Left Column: Image + Details (70%) */}
                            <div className="w-[70%] flex flex-col border-r border-white/10 relative">
                                {/* Image Container */}
                                <div className="relative w-full aspect-[4/3] mx-auto bg-black group overflow-hidden min-h-0 flex-1">
                                    {/* Zoom Controls - Hover to Expand */}
                                    {["JPG", "JPEG", "PNG", "GIF"].includes(selectedEntry.format?.toUpperCase()) && (
                                        <div className="absolute bottom-4 right-4 z-20 flex items-center p-2 bg-black/60 rounded-full backdrop-blur-sm shadow-lg border border-white/10 transition-all duration-300 w-10 hover:w-[320px] overflow-hidden group">
                                            {/* Trigger Icon */}
                                            <Search className="h-5 w-5 text-zinc-400 shrink-0 group-hover:text-white transition-colors cursor-pointer ml-0.5" />

                                            {/* Expanded Controls */}
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pl-4 border-l border-white/10 ml-2 whitespace-nowrap">
                                                <button onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.2))} className="p-1 hover:text-orange-500 transition-colors">
                                                    <ZoomOut className="h-4 w-4" />
                                                </button>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="2"
                                                    step="0.1"
                                                    value={zoomLevel}
                                                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                                                    className="w-24 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                                />
                                                <button onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.2))} className="p-1 hover:text-orange-500 transition-colors">
                                                    <ZoomIn className="h-4 w-4" />
                                                </button>
                                                <span className="text-xs font-mono w-10 text-center inline-block">{Math.round(zoomLevel * 100)}%</span>
                                            </div>
                                        </div>
                                    )}

                                    {(() => {
                                        const files = selectedEntry.files || [{ fileUrl: selectedEntry.fileUrl, format: selectedEntry.format || 'jpg' }];
                                        const activeFile = files[activeFileIndex];
                                        if (!activeFile) return null;

                                        const format = (activeFile.format || 'jpg').toLowerCase();

                                        if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(format)) {
                                            return (
                                                <div
                                                    className={cn(
                                                        "w-full h-full flex items-center justify-center transition-all duration-300",
                                                        zoomLevel > 1 ? "overflow-auto" : "overflow-hidden"
                                                    )}
                                                    onClick={(e) => zoomLevel > 1 && e.stopPropagation()}
                                                >
                                                    <img
                                                        src={activeFile.fileUrl}
                                                        alt="Entry Content"
                                                        className="transition-all duration-200 ease-out object-contain m-auto max-w-full max-h-full"
                                                        style={{
                                                            width: zoomLevel > 1 ? `${zoomLevel * 100}%` : 'auto',
                                                            height: zoomLevel > 1 ? `${zoomLevel * 100}%` : 'auto',
                                                            maxWidth: zoomLevel > 1 ? 'none' : '100%',
                                                            maxHeight: zoomLevel > 1 ? 'none' : '100%'
                                                        }}
                                                    />
                                                </div>
                                            );
                                        } else if (['mp4', 'mov', 'webm'].includes(format)) {
                                            return (
                                                <div className="w-full h-full flex items-center justify-center p-4">
                                                    <video
                                                        src={activeFile.fileUrl}
                                                        controls
                                                        className="max-w-full max-h-full rounded-lg shadow-2xl"
                                                        autoPlay
                                                    />
                                                </div>
                                            );
                                        } else if (format === 'pdf') {
                                            return (
                                                <div className="w-full h-full flex items-center justify-center p-4">
                                                    <iframe
                                                        src={activeFile.fileUrl}
                                                        className="w-full h-full border-none rounded-lg bg-white"
                                                        title="PDF Viewer"
                                                    />
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground p-8">
                                                    <div className="text-center">
                                                        <div className="p-6 bg-white/5 rounded-full mb-6 inline-block">
                                                            <Layers className="h-20 w-20 text-orange-500" />
                                                        </div>
                                                        <div className="text-4xl font-black uppercase tracking-widest mb-4">{format}</div>
                                                        <p className="text-zinc-400 mb-8 max-w-xs mx-auto">This file format requires a specialized application to view. You can download it below.</p>
                                                        <a
                                                            href={activeFile.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center gap-3 mx-auto w-fit"
                                                        >
                                                            <Download className="h-5 w-5" /> Download {format.toUpperCase()}
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })()}

                                    {/* File Selection Thumbnails (If Multiple) */}
                                    {(selectedEntry.files?.length > 1) && (
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 z-20">
                                            {selectedEntry.files.map((file: any, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActiveFileIndex(idx)}
                                                    className={cn(
                                                        "h-12 w-12 rounded-lg overflow-hidden border-2 transition-all",
                                                        activeFileIndex === idx ? "border-orange-500 scale-110 shadow-lg shadow-orange-500/20" : "border-transparent opacity-50 hover:opacity-100"
                                                    )}
                                                >
                                                    {['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes((file.format || '').toLowerCase()) ? (
                                                        <img src={file.fileUrl} className="w-full h-full object-cover" />
                                                    ) : ['mp4', 'mov', 'webm'].includes((file.format || '').toLowerCase()) ? (
                                                        <div className="w-full h-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                            <Film className="h-5 w-5" />
                                                        </div>
                                                    ) : ['pdf', 'doc', 'docx'].includes((file.format || '').toLowerCase()) ? (
                                                        <div className="w-full h-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                                            <Layers className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Info */}
                                <div className="w-full bg-zinc-900 border-t border-white/10 text-white p-6 shrink-0 z-10">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg font-semibold">Entry #{entries.length - entries.findIndex(e => e._id === selectedEntry._id)}</h3>
                                                    {selectedEntry.status === 'awarded' && (
                                                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30 flex items-center gap-1">
                                                            <Trophy className="h-3 w-3" /> AWARDED
                                                        </span>
                                                    )}
                                                    {selectedEntry.status === 'rejected' && (
                                                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 flex items-center gap-1">
                                                            <ThumbsDown className="h-3 w-3" /> REJECTED
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
                                                        {selectedEntry.freelancerId?.avatarUrl ? (
                                                            <img src={selectedEntry.freelancerId.avatarUrl} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-xs font-bold text-zinc-500">
                                                                {(selectedEntry.freelancerId?.username || "FR").substring(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-zinc-400">
                                                            by <Link
                                                                href={`/profile/${selectedEntry.freelancerId?.username}`}
                                                                onClick={() => setSelectedEntry(null)}
                                                                className="text-zinc-300 hover:text-white hover:underline font-medium transition-colors"
                                                            >
                                                                {selectedEntry.freelancerId?.username || "Unknown Freelancer"}
                                                            </Link>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <button className="text-zinc-500 hover:text-rose-500 transition-colors">
                                                                <Heart className="h-4 w-4" />
                                                            </button>
                                                            <a href={selectedEntry.files?.[activeFileIndex]?.fileUrl || selectedEntry.fileUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-blue-500 transition-colors">
                                                                <Download className="h-4 w-4" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Rating & Actions */}
                                            <div className="flex flex-col items-end gap-3 shrink-0">
                                                {/* Rating */}
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Rating</div>
                                                    <div className="flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                onClick={() => isOwner && handleRateEntry(selectedEntry._id, star)}
                                                                className={cn(
                                                                    "transition-colors",
                                                                    isOwner ? "cursor-pointer hover:text-amber-500" : "cursor-default"
                                                                )}
                                                                disabled={!isOwner}
                                                            >
                                                                <Star
                                                                    className={cn(
                                                                        "h-6 w-6",
                                                                        (selectedEntry.rating || 0) >= star ? "fill-amber-500 text-amber-500" : "text-zinc-700"
                                                                    )}
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-3">
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/5 font-mono uppercase">
                                                            {selectedEntry.files?.[activeFileIndex]?.fileType || selectedEntry.format || "FILE"}
                                                        </span>

                                                        {/* Creator Actions */}
                                                        {isOwner && selectedEntry.status === 'awarded' && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 flex items-center gap-1.5">
                                                                    <Trophy className="h-3.5 w-3.5" /> Awarded
                                                                </span>
                                                            </div>
                                                        )}
                                                        {isOwner && selectedEntry.status === 'rejected' && (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => setConfirmationAction({ type: 'unreject', entryId: selectedEntry._id })}
                                                                    className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold border border-red-500/20 transition-colors flex items-center gap-1.5"
                                                                    title="Cancel Rejection"
                                                                >
                                                                    <ThumbsDown className="h-3.5 w-3.5" /> Rejected
                                                                </button>
                                                            </div>
                                                        )}
                                                        {isOwner && (!selectedEntry.status || selectedEntry.status === 'active') && (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => setConfirmationAction({ type: 'reject', entryId: selectedEntry._id })}
                                                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                                                                    title="Reject Entry"
                                                                >
                                                                    <ThumbsDown className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmationAction({ type: 'award', entryId: selectedEntry._id })}
                                                                    className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                                                                    title="Award Winner"
                                                                >
                                                                    <Trophy className="h-3.5 w-3.5" /> Award
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Right Column: Comments (30%) */}
                            <div className="w-[30%] flex flex-col bg-zinc-950 h-full">
                                {/* Description Section (Moved from Bottom) */}
                                <div className="p-4 border-b border-white/10 bg-zinc-900/30 shrink-0">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Description</h4>
                                    <div className="max-h-[100px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                                        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedEntry.description || "No description provided."}</p>
                                    </div>
                                </div>

                                <div className="p-4 border-b border-white/10 bg-zinc-900/50 flex items-center gap-2 shrink-0 h-[60px]">
                                    <MessageCircle className="h-5 w-5 text-zinc-400" />
                                    <h3 className="font-semibold text-white">Comments</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs text-zinc-400">{comments.length}</span>
                                </div>

                                {/* Comments List - Scrollable */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950">
                                    {isLoadingComments ? (
                                        <div className="text-center py-8 text-zinc-500">Loading discussion...</div>
                                    ) : comments.length === 0 ? (
                                        <div className="text-center py-8 text-zinc-500 italic">No comments yet. Start the conversation!</div>
                                    ) : (
                                        comments.map((comment) => {
                                            const isClient = comment.authorId?._id === (contest.createdBy?._id || contest.createdBy);

                                            // Simple time ago helper
                                            const timeAgo = (date: string) => {
                                                const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
                                                let interval = seconds / 31536000;
                                                if (interval > 1) return Math.floor(interval) + " years ago";
                                                interval = seconds / 2592000;
                                                if (interval > 1) return Math.floor(interval) + " months ago";
                                                interval = seconds / 86400;
                                                if (interval > 1) return Math.floor(interval) + " days ago";
                                                interval = seconds / 3600;
                                                if (interval > 1) return Math.floor(interval) + " hours ago";
                                                interval = seconds / 60;
                                                if (interval > 1) return Math.floor(interval) + " mins ago";
                                                return Math.floor(seconds) + " seconds ago";
                                            };

                                            return (
                                                <div key={comment._id} className="border rounded-lg p-3 space-y-2 transition-colors bg-amber-950/10 border-amber-900/20 hover:border-amber-900/40 relative">
                                                    <div className="flex items-center justify-between">
                                                        {isClient ? (
                                                            <span className="text-xs font-bold text-amber-500 uppercase tracking-wide">Contest Holder</span>
                                                        ) : (
                                                            <Link
                                                                href={`/profile/${comment.authorId?.username}`}
                                                                onClick={() => setSelectedEntry(null)}
                                                                className="text-xs font-semibold text-amber-500/90 hover:text-amber-400 hover:underline transition-colors"
                                                            >
                                                                {comment.authorId?.username || "Unknown User"}
                                                            </Link>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-zinc-400 leading-relaxed pb-2">
                                                        {comment.content}
                                                    </p>
                                                    <div className="absolute bottom-2 right-3">
                                                        <span className="text-[10px] text-zinc-600 font-medium">{timeAgo(comment.createdAt)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Post Comment Input */}
                                <div className="p-4 bg-zinc-900 border-t border-white/10 shrink-0">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                            placeholder="Write a comment..."
                                            className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                        <button
                                            onClick={handlePostComment}
                                            disabled={!commentText.trim()}
                                            className="p-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Send className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Confirmation Modal */}
            {
                confirmationAction && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-3 rounded-full ${confirmationAction.type === 'award'
                                    ? 'bg-green-500/10 text-green-500'
                                    : confirmationAction.type === 'unreject'
                                        ? 'bg-orange-500/10 text-orange-500'
                                        : 'bg-red-500/10 text-red-500'
                                    }`}>
                                    {confirmationAction.type === 'award' ? <Trophy className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                                </div>
                                <h3 className="text-xl font-bold text-white">
                                    {confirmationAction.type === 'award'
                                        ? 'Award Winner'
                                        : confirmationAction.type === 'unreject'
                                            ? 'Cancel Rejection'
                                            : 'Reject Entry'
                                    }
                                </h3>
                            </div>

                            <p className="text-zinc-400 mb-6">
                                {confirmationAction.type === 'award'
                                    ? "Are you sure you want to Award this entry? This action will mark this entry as the winner and CLOSE the contest. This cannot be undone."
                                    : confirmationAction.type === 'unreject'
                                        ? "Are you sure you want to cancel the rejection? This will restore the entry to active status and make it visible in the main list again."
                                        : "Are you sure you want to Reject this entry? This will hide the entry from the main list."
                                }
                            </p>

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setConfirmationAction(null)}
                                    className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmAction}
                                    className={`px-4 py-2 rounded-lg text-white font-bold transition-colors ${confirmationAction.type === 'award'
                                        ? 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20'
                                        : confirmationAction.type === 'unreject'
                                            ? 'bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-500/20'
                                            : 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20'
                                        }`}
                                >
                                    Confirm {confirmationAction.type === 'award' ? 'Award' : confirmationAction.type === 'unreject' ? 'Restore' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Agreement Sign Popup */}
            {
                showAgreementPopup && (
                    <AgreementSignPopup
                        contestId={contest._id}
                        entryId={awardedEntry?._id}
                        userType={isOwner ? "client" : "freelancer"}
                        onClose={() => setShowAgreementPopup(false)}
                        onSign={async () => {
                            // Refresh agreement data
                            const res = await getAgreement(contest._id);
                            if (res.success) setAgreement(res.agreement);
                        }}
                    />
                )
            }

            {/* Handover Upload Popup */}
            {
                showHandoverUploadPopup && (
                    <HandoverUploadPopup
                        contestId={contest._id}
                        initialHandover={handover}
                        onClose={() => setShowHandoverUploadPopup(false)}
                        onSubmit={async () => {
                            // Refresh handover data
                            const res = await getHandover(contest._id);
                            if (res.success) setHandover(res.handover);
                        }}
                    />
                )
            }

            {/* Handover Review Popup */}
            {
                showHandoverReviewPopup && handover && (
                    <HandoverReviewPopup
                        contestId={contest._id}
                        handover={handover}
                        onClose={() => setShowHandoverReviewPopup(false)}
                        onAccept={async () => {
                            // Refresh handover data
                            const res = await getHandover(contest._id);
                            if (res.success) setHandover(res.handover);
                        }}
                        ratingMode={ratingMode}
                        clientData={
                            ratingMode === 'client' ? {
                                clientId: typeof contest.createdBy === 'object' ? contest.createdBy._id : contest.createdBy,
                                clientUsername: typeof contest.createdBy === 'object' ? contest.createdBy.username : 'Client',
                                contestTitle: contest.title,
                                price: contest.prizeAmount || contest.prize || 0
                            } : undefined
                        }
                    />
                )
            }
        </div >
    );
}
