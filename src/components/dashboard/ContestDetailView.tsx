"use client";

import { useState, useEffect } from "react";
import { useScrollAware } from "@/hooks/useScrollAware";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/date";
import { Clock, Trophy, MapPin, Share2, Upload, CheckCircle, DollarSign, Star, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Search, MessageCircle, Send, ThumbsDown, AlertTriangle } from "lucide-react";
import { submitEntry, getContestEntries, rateEntry, rejectEntry, awardEntry, unrejectEntry } from "@/lib/actions/entries";
import { getEntryComments, postEntryComment } from "@/lib/actions/comments";
import Link from "next/link";
import FileUploader from "@/components/ui/FileUploader";
import { useUser } from "@/context/UserContext";

import { BookmarkButton } from "@/components/shared/BookmarkButton";

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

    // Confirmation State
    const [confirmationAction, setConfirmationAction] = useState<{ type: 'award' | 'reject' | 'unreject', entryId: string } | null>(null);

    const [selectedEntry, setSelectedEntry] = useState<any>(null); // State for modal view
    const [zoomLevel, setZoomLevel] = useState(1); // State for zoom scale
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState("");
    const [isLoadingComments, setIsLoadingComments] = useState(false);

    useEffect(() => {
        if (activeSection === "Entries") {
            loadEntries();
        }
    }, [activeSection, contest._id]);

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

    const handleSubmit = async () => {
        if (!submissionFile) {
            setError("Please upload a file");
            return;
        }

        // Validate format client-side against contest deliverables
        if (contest.deliverables && contest.deliverables.length > 0) {
            const uploadedFormat = submissionFile.format.toUpperCase();
            // Map common cloudinary formats to our list
            // Cloudinary returns "jpg", "png", "pdf" etc.

            const isAllowed = contest.deliverables.some((d: string) => {
                const fmt = d.toUpperCase();
                if (fmt === "JPG" || fmt === "JPEG") return uploadedFormat === "JPG" || uploadedFormat === "JPEG";
                if (fmt === "DOC" || fmt === "DOCX" || fmt === "WORD" || fmt === "DOCS") return ["DOC", "DOCX"].includes(uploadedFormat);
                return fmt === uploadedFormat;
            });

            if (!isAllowed) {
                setError(`File format ${uploadedFormat} is not allowed. Accepted: ${contest.deliverables.join(", ")}`);
                return;
            }
        }

        setIsSubmitting(true);
        const result = await submitEntry({
            contestId: contest._id,
            fileUrl: submissionFile.url,
            format: submissionFile.format,
            description: submissionDesc
        });

        if (result.success) {
            setShowSubmissionForm(false);
            setSubmissionFile(null);
            setSubmissionDesc("");
            loadEntries();
        } else {
            setError(result.error || "Failed to submit");
        }
        setIsSubmitting(false);
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
                    name: user?.name,
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
            await awardEntry(contest._id, entryId);
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

    return (
        <div className="h-[calc(100vh-4rem)] overflow-hidden bg-background flex flex-col">
            {/* Main Scrollable Area */}
            <div className="flex-1 overflow-y-auto scrollbar-fade" onScroll={centerPanel.onScroll}>
                <div className="max-w-[1536px] mx-auto w-full"> {/* Wide container */}

                    {/* Unified Header */}
                    <div className="px-6 py-5 border-b border-border/40 bg-card/50">
                        <div className="flex justify-between items-start gap-4">
                            {/* Left: Title & Meta */}
                            <div className="space-y-3 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-wider border border-orange-500/20">
                                        Contest
                                    </span>
                                    {contest.status === 'closed' ? (
                                        <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider border border-zinc-700">
                                            Closed
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                                            Open
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight tracking-tight pr-4">
                                    {contest.title}
                                </h1>
                            </div>

                            {/* Right: Price & Actions */}
                            <div className="flex items-start gap-6 shrink-0 pl-4">
                                <div className="flex items-center gap-2 mt-1">
                                    {/* Share */}
                                    <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                                        <Share2 className="h-5 w-5" />
                                    </button>

                                    {/* Bookmark */}
                                    <BookmarkButton
                                        itemId={contest._id}
                                        itemType="contest"
                                        initialSavedState={isSaved}
                                        activeColor="text-amber-500"
                                        className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground"
                                    />
                                </div>

                                {/* Price Block */}
                                <div className="text-right bg-muted/30 px-4 py-2 rounded-lg border border-border/50">
                                    <div className="text-2xl font-bold text-orange-500 leading-none">
                                        ${contest.prize}
                                    </div>
                                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
                                        Prize Amount
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Tabs & Date */}
                        <div className="flex items-end justify-between mt-5">
                            {/* Tabs */}
                            <div className="flex items-center gap-8 translate-y-[1px]">
                                <button
                                    onClick={() => setActiveSection("Details")}
                                    className={cn(
                                        "pb-2 text-sm font-medium border-b-2 transition-colors",
                                        activeSection === "Details"
                                            ? "border-orange-500 text-orange-500"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => setActiveSection("Entries")}
                                    className={cn(
                                        "pb-2 text-sm font-medium border-b-2 transition-colors",
                                        activeSection === "Entries"
                                            ? "border-orange-500 text-orange-500"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Entries
                                </button>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pb-2">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="capitalize">Posted {timeAgo(contest.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeSection === "Details" ? (
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                                {/* Left Column: Description */}
                                <div className="space-y-8 min-w-0">
                                    <div className="prose dark:prose-invert max-w-none text-foreground/90 leading-relaxed">
                                        <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
                                        <p className="whitespace-pre-wrap">{contest.description}</p>
                                    </div>

                                    {/* Skills */}
                                    {contest.skills && contest.skills.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-foreground mb-3">Skills Required</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {contest.skills.map((skill: string) => (
                                                    <span key={skill} className="px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-sm font-medium border border-orange-500/20">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Deliverables */}
                                    {contest.deliverables && contest.deliverables.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-foreground mb-3">Allowed Deliverables</h3>
                                            <div className="flex gap-2">
                                                {contest.deliverables.map((item: string, idx: number) => (
                                                    <span key={idx} className="px-2.5 py-1 rounded bg-muted text-foreground text-xs font-mono border border-border">{item}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Client Info & Sidebar */}
                                <div className="space-y-6 lg:border-l lg:border-border lg:pl-8">
                                    {/* Client Info */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">About Client</h3>
                                        <div className="bg-card rounded-lg p-4 border border-border">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm overflow-hidden">
                                                    {client.avatarUrl ? <img src={client.avatarUrl} alt={client.name} className="h-full w-full object-cover" /> : (client.name?.substring(0, 2).toUpperCase() || "CL")}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm text-foreground">{client.name || "Unknown Client"}</div>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <MapPin className="h-3 w-3" /> {client.location || "Remote"}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs py-2 border-t border-border/50">
                                                <div className="text-muted-foreground">Rating</div>
                                                <div className="font-medium">{client.rating || 0} <span className="text-muted-foreground">({client.reviewsCount || 0})</span></div>
                                            </div>

                                            {/* Verification Icons */}
                                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                                                <div className="flex items-center gap-3">
                                                    <div title="Identity Verified" className={cn("p-1.5 rounded-full", client.identityVerified ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground")}>
                                                        <CheckCircle className="h-4 w-4" />
                                                    </div>
                                                    <div title="Payment Verified" className={cn("p-1.5 rounded-full", client.paymentVerified ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground")}>
                                                        <DollarSign className="h-4 w-4" />
                                                    </div>
                                                    <div title="Email Verified" className={cn("p-1.5 rounded-full", client.emailVerified ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground")}>
                                                        <div className="h-4 w-4 font-bold text-xs flex items-center justify-center">@</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Similar Contests */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Similar Contests</h3>
                                        {similarContests.length > 0 ? (
                                            <div className="space-y-2">
                                                {similarContests.map((c) => (
                                                    <div key={c._id} className="group cursor-pointer hover:bg-card p-3 rounded-lg border border-transparent hover:border-amber-200 transition-all">
                                                        <div className="font-medium text-sm text-foreground group-hover:text-amber-600 transition-colors line-clamp-1">
                                                            {c.title}
                                                        </div>
                                                        <div className="flex items-center justify-between mt-1.5">
                                                            <span className="text-xs font-semibold text-foreground">${c.prize}</span>
                                                            <span className="text-[10px] text-muted-foreground">Open</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground">No similar contests found.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Header Section */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <h3 className="font-semibold text-lg text-foreground">Entries</h3>

                                        {/* Filter & Sort Controls */}
                                        <div className="flex items-center gap-2">
                                            {/* Filter Dropdown */}
                                            <div className="relative group">
                                                <button className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium border border-border flex items-center gap-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                                    Filter: {filter === "all" ? "All Entries" : filter === "my" ? "My Entries" : "Rejected"}
                                                </button>
                                                <div className="absolute top-full left-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg overflow-hidden hidden group-hover:block z-20">
                                                    <button onClick={() => setFilter("all")} className="w-full text-left px-4 py-2 text-xs hover:bg-muted transition-colors">All Entries</button>
                                                    <button onClick={() => setFilter("my")} className="w-full text-left px-4 py-2 text-xs hover:bg-muted transition-colors">My Entries</button>
                                                    <button onClick={() => setFilter("rejected")} className="w-full text-left px-4 py-2 text-xs hover:bg-muted transition-colors">Rejected Entries</button>
                                                </div>
                                            </div>

                                            {/* Sort Dropdown */}
                                            <div className="relative group">
                                                <button className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium border border-border flex items-center gap-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                                    Sort: {sortBy === "default" ? "Default" : "Time"}
                                                </button>
                                                <div className="absolute top-full left-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg overflow-hidden hidden group-hover:block z-20">
                                                    <button onClick={() => setSortBy("default")} className="w-full text-left px-4 py-2 text-xs hover:bg-muted transition-colors">Default (Rated First)</button>
                                                    <button onClick={() => setSortBy("newest")} className="w-full text-left px-4 py-2 text-xs hover:bg-muted transition-colors">Time Submitted</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {!showSubmissionForm && user?.id !== (contest.createdBy?._id || contest.createdBy) && (
                                        <button
                                            onClick={() => setShowSubmissionForm(true)}
                                            className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm"
                                        >
                                            Participate Now
                                        </button>
                                    )}
                                </div>

                                {/* Submission Form */}
                                {showSubmissionForm && (
                                    <div className="bg-card rounded-lg p-6 border border-border space-y-4 max-w-2xl">
                                        <h3 className="font-semibold text-lg">New Entry</h3>
                                        {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>}

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Upload File</label>
                                            {!submissionFile ? (
                                                <FileUploader
                                                    onUploadSuccess={handleUploadSuccess}
                                                    className="h-32"
                                                    label={`Upload ${contest.deliverables?.join(", ")}`}
                                                    allowedFormats={contest.deliverables}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                                        <span className="text-sm truncate font-mono">{submissionFile.format} - File Uploaded</span>
                                                    </div>
                                                    <button onClick={() => setSubmissionFile(null)} className="text-xs text-destructive hover:underline">Remove</button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Description (Optional)</label>
                                            <textarea
                                                className="w-full p-3 rounded-lg border bg-background text-sm"
                                                placeholder="Describe your entry..."
                                                value={submissionDesc}
                                                onChange={e => setSubmissionDesc(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3 pt-2">
                                            <button
                                                onClick={() => setShowSubmissionForm(false)}
                                                className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={!submissionFile || isSubmitting}
                                                className="px-6 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                                            >
                                                {isSubmitting ? "Submitting..." : "Submit Entry"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Entries List */}
                                <div className="space-y-4">
                                    {(() => {
                                        // 1. Filter
                                        let filteredEntries = entries.filter(e => {
                                            if (filter === "my") return e.freelancerId?._id === user?.id; // Assuming user.id available
                                            if (filter === "rejected") return e.status === "rejected";
                                            // For "all", we typically SHOW "active" and "awarded", but "rejected" are usually hidden or at bottom.
                                            // Requirement: "all entries like in order of time submitted and more rated at first then non rated then rejected"
                                            // So "All" includes rejected?
                                            // "rejected entries show like a partial vision"
                                            return true;
                                        });

                                        // 2. Sort
                                        filteredEntries.sort((a, b) => {
                                            if (sortBy === "newest") {
                                                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                                            }

                                            // Default Sort Logic
                                            // 1. Awarded entries first
                                            if (a.status === 'awarded' && b.status !== 'awarded') return -1;
                                            if (b.status === 'awarded' && a.status !== 'awarded') return 1;

                                            // 2. Rated vs Not Rated
                                            if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);

                                            // 3. Active vs Rejected
                                            if (a.status !== b.status) {
                                                if (a.status === 'rejected') return 1; // Rejected last
                                                if (b.status === 'rejected') return -1;
                                            }
                                            return 0;
                                        });

                                        if (filteredEntries.length === 0) {
                                            return (
                                                <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border rounded-lg">
                                                    No entries found matching filter.
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {filteredEntries.map((entry, index) => {
                                                    const isRejected = entry.status === "rejected";
                                                    const isAwarded = entry.status === "awarded";

                                                    return (
                                                        <div key={entry._id} className={cn(
                                                            "bg-[#fffbf7] hover:bg-orange-50 shadow-sm border-none rounded-lg p-3 transition-all flex flex-col gap-3 group/card relative",
                                                            isRejected && "opacity-60 grayscale-[0.5]"
                                                        )}>
                                                            {/* Winner Badge - Top Right */}
                                                            {isAwarded && (
                                                                <div className="absolute top-2 right-2 z-20">
                                                                    <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-1 rounded-full font-bold text-[10px] tracking-wider shadow-lg border-2 border-white/50 backdrop-blur-sm flex items-center gap-1">
                                                                        <Trophy className="h-3 w-3" /> WINNER
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Rejected Overlay/Style */}
                                                            {isRejected && (
                                                                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                                                    <div className="bg-red-500/90 text-white px-4 py-2 rounded-[20px] font-bold text-sm tracking-wider shadow-lg transform -rotate-12 border-2 border-white/20 backdrop-blur-sm">
                                                                        REJECTED
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Header: #No and Name Link */}
                                                            <div className="flex items-center justify-between text-xs">
                                                                <div className="font-bold text-orange-500">#{entries.length - entries.findIndex(e => e._id === entry._id)}</div>
                                                                <div className="font-bold text-orange-600 hover:text-orange-700 hover:underline truncate max-w-[120px]">
                                                                    <Link href={`/profile/${entry.freelancerId?._id}`}>{entry.freelancerId?.name || "Freelancer"}</Link>
                                                                </div>
                                                            </div>

                                                            {/* Body: Image */}
                                                            <div
                                                                className="aspect-square bg-white border border-black/5 rounded-md flex items-center justify-center overflow-hidden relative group shadow-inner cursor-pointer"
                                                                onClick={() => setSelectedEntry(entry)}
                                                            >
                                                                {/* Preview based on format */}
                                                                {["JPG", "JPEG", "PNG", "GIF"].includes(entry.format?.toUpperCase()) ? (
                                                                    <img src={entry.fileUrl} alt="Entry" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                                                ) : (
                                                                    <div className="text-stone-400 font-mono text-xs">{entry.format} FILE</div>
                                                                )}

                                                                {/* Overlay hint */}
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                                    <span className="opacity-0 group-hover:opacity-100 bg-black/70 text-white text-xs px-2 py-1 rounded transition-opacity">View</span>
                                                                </div>
                                                            </div>

                                                            {/* Footer: Rating */}
                                                            <div className="flex justify-end pt-1">
                                                                {/* Only contest owner (client) can rate, others view only */}
                                                                <div className="flex items-center gap-0.5">
                                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                                        <button
                                                                            key={star}
                                                                            onClick={() => isOwner && handleRateEntry(entry._id, star)}
                                                                            className={cn(
                                                                                "transition-colors",
                                                                                isOwner ? "cursor-pointer hover:text-amber-500" : "cursor-default"
                                                                            )}
                                                                            disabled={!isOwner}
                                                                        >
                                                                            <Star
                                                                                className={cn(
                                                                                    "h-4 w-4",
                                                                                    (entry.rating || 0) >= star ? "fill-amber-500 text-amber-500" : "text-border/40"
                                                                                )}
                                                                            />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Full Size Entry Modal */}
            {selectedEntry && (
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

                                <div
                                    className={cn(
                                        "w-full h-full flex items-center justify-center transition-all duration-300",
                                        zoomLevel > 1 ? "overflow-auto" : "overflow-hidden"
                                    )}
                                    onClick={(e) => zoomLevel > 1 && e.stopPropagation()}
                                >
                                    {["JPG", "JPEG", "PNG", "GIF"].includes(selectedEntry.format?.toUpperCase()) ? (
                                        <img
                                            src={selectedEntry.fileUrl}
                                            alt="Full Size Entry"
                                            className="transition-all duration-200 ease-out object-contain m-auto max-w-full max-h-full"
                                            style={{
                                                width: zoomLevel > 1 ? `${zoomLevel * 100}%` : 'auto',
                                                height: zoomLevel > 1 ? `${zoomLevel * 100}%` : 'auto',
                                                maxWidth: zoomLevel > 1 ? 'none' : '100%',
                                                maxHeight: zoomLevel > 1 ? 'none' : '100%'
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground p-8">
                                            <div className="text-center">
                                                <div className="text-4xl font-mono mb-4">{selectedEntry.format}</div>
                                                <p>File preview not available</p>
                                                <a href={selectedEntry.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-primary hover:underline">Download File</a>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                                            <div className="text-sm text-zinc-400">
                                                by <Link href={`/profile/${selectedEntry.freelancerId?._id}`} className="text-zinc-300 hover:text-white hover:underline font-medium transition-colors">{selectedEntry.freelancerId?.name || "Unknown Freelancer"}</Link>
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
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/5 font-mono">{selectedEntry.format}</span>

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
                                                        <Link href={`/profile/${comment.authorId?._id}`} className="text-xs font-semibold text-amber-500/90 hover:text-amber-400 hover:underline transition-colors">
                                                            {comment.authorId?.name || "Unknown User"}
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
            {confirmationAction && (
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
            )}
        </div >
    );
}
