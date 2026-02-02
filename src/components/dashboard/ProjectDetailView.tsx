"use client";

import { useState, useEffect } from "react";
import { useScrollAware } from "@/hooks/useScrollAware";
import { cn } from "@/lib/utils";
import { Clock, MapPin, DollarSign, Share2, FileText, Paperclip, CheckCircle } from "lucide-react";
import { submitBid, getProjectBids } from "@/lib/actions/bids";
import { useUser } from "@/context/UserContext";
import { BookmarkButton } from "@/components/shared/BookmarkButton";

interface ProjectDetailViewProps {
    project: any;
    similarProjects: any[];
    isSaved: boolean;
}

export function ProjectDetailView({ project, similarProjects, isSaved }: ProjectDetailViewProps) {
    // Scroll Awareness
    const centerPanel = useScrollAware(3000);
    const rightPanel = useScrollAware(3000);
    const { user } = useUser();

    const [activeSection, setActiveSection] = useState<"Project" | "Bids">("Project");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bids, setBids] = useState<any[]>([]);
    const [showBidForm, setShowBidForm] = useState(false);
    const [bidAmount, setBidAmount] = useState<number | "">("");
    const [bidDays, setBidDays] = useState<number | "">("");
    const [bidProposal, setBidProposal] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (activeSection === "Bids") {
            loadBids();
        }
    }, [activeSection, project._id]);

    const loadBids = async () => {
        const data = await getProjectBids(project._id);
        setBids(data);
    };

    const handleSubmit = async () => {
        if (!bidAmount || !bidDays || !bidProposal) {
            setError("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);
        const result = await submitBid({
            projectId: project._id,
            amount: Number(bidAmount),
            days: Number(bidDays),
            proposal: bidProposal
        });

        if (result.success) {
            setShowBidForm(false);
            setBidAmount("");
            setBidDays("");
            setBidProposal("");
            loadBids();
        } else {
            setError(result.error || "Failed to submit proposal");
        }
        setIsSubmitting(false);
    };

    if (!project) return <div>Project not found</div>;

    const client = project.createdBy || {};

    return (
        <div className="h-[calc(100vh-4rem)] overflow-hidden bg-background">
            <div className="flex h-full max-w-[1920px] mx-auto">
                {/* Center Content Panel */}
                <div
                    className="flex-1 h-full flex flex-col border-r border-border scrollbar-fade"
                >
                    {/* Main Layout Container */}
                    <div className="max-w-4xl w-full mx-auto px-6 py-8 h-full flex flex-col">

                        {/* Unified Card - Clean Style */}
                        <div className="w-full bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">

                            {/* Header Section - No Bottom Border */}
                            <div className="px-8 pt-8 pb-0 shrink-0 bg-card z-10 flex flex-col gap-6">
                                <div className="flex justify-between items-start gap-4">
                                    {/* Left: Title & Meta */}
                                    <div className="space-y-3 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-500 text-[10px] font-bold uppercase tracking-wider border border-purple-500/20">
                                                Project
                                            </span>
                                        </div>

                                        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight tracking-tight pr-4">
                                            {project.title}
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
                                                itemId={project._id}
                                                itemType="project"
                                                initialSavedState={isSaved}
                                                activeColor="text-purple-500"
                                                className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground"
                                            />
                                        </div>

                                        {/* Price Block */}
                                        <div className="text-right bg-muted/30 px-4 py-2 rounded-lg border border-border/50">
                                            <div className="text-2xl font-bold text-purple-500 leading-none">
                                                ${project.budget}
                                            </div>
                                            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
                                                Fixed Price
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Row: Tabs & Date */}
                                <div className="flex items-end justify-between border-b border-border/40">
                                    {/* Tabs */}
                                    <div className="flex items-center gap-8 translate-y-[1px]">
                                        <button
                                            onClick={() => setActiveSection("Project")}
                                            className={cn(
                                                "pb-4 text-sm font-medium border-b-2 transition-colors",
                                                activeSection === "Project"
                                                    ? "border-purple-500 text-purple-500"
                                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Project Details
                                        </button>
                                        <button
                                            onClick={() => setActiveSection("Bids")}
                                            className={cn(
                                                "pb-4 text-sm font-medium border-b-2 transition-colors",
                                                activeSection === "Bids"
                                                    ? "border-purple-500 text-purple-500"
                                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Proposals ({bids.length})
                                        </button>
                                    </div>

                                    {/* Date - Parallel to Tabs */}
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pb-4">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>Posted {new Date(project.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section - Scrollable */}
                            <div className="flex-1 bg-card/50 overflow-y-auto scrollbar-fade" onScroll={centerPanel.onScroll}>
                                <div className="px-8 py-8 space-y-8">
                                    {/* Content Area */}
                                    {activeSection === "Project" && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            {/* Description */}
                                            <div className="prose dark:prose-invert max-w-none text-foreground/90 leading-relaxed">
                                                <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
                                                <p className="whitespace-pre-wrap">{project.description}</p>
                                            </div>

                                            {/* Skills */}
                                            {project.skills && project.skills.length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-foreground mb-3">Skills Required</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {project.skills.map((skill: string) => (
                                                            <span key={skill} className="px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-500 text-sm font-medium border border-purple-500/20">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Deliverables */}
                                            {project.deliverables && project.deliverables.length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-foreground mb-3">Deliverables</h3>
                                                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                                                        {project.deliverables.map((item: string, idx: number) => (
                                                            <li key={idx}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeSection === "Bids" && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            {/* Header Section */}
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-lg text-foreground">Proposals ({bids.length})</h3>
                                                {!showBidForm && user?.id !== (project.createdBy?._id || project.createdBy) && (
                                                    <button
                                                        onClick={() => setShowBidForm(true)}
                                                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                                                    >
                                                        Submit a Proposal
                                                    </button>
                                                )}
                                            </div>

                                            {/* Bid Form */}
                                            {showBidForm && (
                                                <div className="bg-card rounded-lg p-6 border border-border space-y-4">
                                                    <h3 className="font-semibold text-lg">New Proposal</h3>
                                                    {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>}

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Bid Amount ($)</label>
                                                            <input
                                                                type="number"
                                                                className="w-full p-2.5 rounded-lg border bg-background text-sm"
                                                                placeholder="e.g. 500"
                                                                value={bidAmount}
                                                                onChange={e => setBidAmount(Number(e.target.value))}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Delivery (Days)</label>
                                                            <input
                                                                type="number"
                                                                className="w-full p-2.5 rounded-lg border bg-background text-sm"
                                                                placeholder="e.g. 7"
                                                                value={bidDays}
                                                                onChange={e => setBidDays(Number(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Cover Letter</label>
                                                        <textarea
                                                            className="w-full p-3 rounded-lg border bg-background text-sm h-32"
                                                            placeholder="Describe why you are exactly the right person for this project..."
                                                            value={bidProposal}
                                                            onChange={e => setBidProposal(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="flex justify-end gap-3 pt-2">
                                                        <button
                                                            onClick={() => setShowBidForm(false)}
                                                            className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleSubmit}
                                                            disabled={isSubmitting}
                                                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                                                        >
                                                            {isSubmitting ? "Submitting..." : "Send Proposal"}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Proposals List */}
                                            <div className="space-y-4">
                                                {bids.length === 0 ? (
                                                    <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border rounded-lg">
                                                        No proposals yet. Be the first to apply!
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {bids.map(bid => (
                                                            <div key={bid._id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm overflow-hidden">
                                                                            {bid.freelancerId?.avatarUrl ? <img src={bid.freelancerId.avatarUrl} className="h-full w-full object-cover" /> : "FL"}
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-semibold text-sm">{bid.freelancerId?.name || "Freelancer"}</div>
                                                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                                                <span>Rating: {bid.freelancerId?.rating || 0}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="font-bold text-foreground">${bid.amount}</div>
                                                                        <div className="text-xs text-muted-foreground">{bid.days} Days</div>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground line-clamp-2">{bid.proposal}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Info Panel */}
                <div
                    className={cn(
                        "hidden md:block w-80 shrink-0 h-full overflow-y-auto bg-card/30 p-5 space-y-6 scrollbar-fade border-l border-border",
                        rightPanel.isScrolling && "scrolling"
                    )}
                    onScroll={rightPanel.onScroll}
                >
                    {/* Client Info */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">About Client</h3>
                        <div className="bg-card rounded-lg p-4 border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden">
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

                    {/* Similar Projects */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Similar Jobs</h3>
                        {similarProjects.length > 0 ? (
                            <div className="space-y-2">
                                {similarProjects.map((p) => (
                                    <div key={p._id} className="group cursor-pointer hover:bg-card p-3 rounded-lg border border-transparent hover:border-border transition-all">
                                        <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                            {p.title}
                                        </div>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className="text-xs font-semibold text-foreground">${p.budget}</span>
                                            <span className="text-[10px] text-muted-foreground">Fixed</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-muted-foreground">No similar jobs found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
