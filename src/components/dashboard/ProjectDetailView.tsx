"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Clock, DollarSign, Share2, UserCircle, MapPin, CheckCircle, Briefcase, Award, FileText, AlertCircle } from "lucide-react";
import { getProjectBids, acceptBid, rejectBid } from "@/lib/actions/bids";
import { useUser } from "@/context/UserContext";
import { BookmarkButton } from "@/components/shared/BookmarkButton";
import { BidCard } from "./BidCard";
import { SubmitBidModal } from "./SubmitBidModal";
import { timeAgo } from "@/lib/date";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getProjectAgreement } from "@/lib/actions/projectAgreements";
import { getProjectHandover } from "@/lib/actions/projectHandovers";
import { ProjectAgreementPopup } from "./ProjectAgreementPopup";
import { ProjectHandoverPopup } from "./ProjectHandoverPopup";
import { ProjectReviewPopup } from "./ProjectReviewPopup";
import { File, Download, ExternalLink, AlertTriangle, ShieldCheck } from "lucide-react";

interface ProjectDetailViewProps {
    project: any;
    similarProjects: any[];
    isSaved: boolean;
}

export function ProjectDetailView({ project, similarProjects, isSaved }: ProjectDetailViewProps) {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<"Details" | "Bids" | "Project Files">("Details");
    const [bids, setBids] = useState<any[]>([]);
    const [isLoadingBids, setIsLoadingBids] = useState(false);
    const [showBidModal, setShowBidModal] = useState(false);
    const [isProcessingBid, setIsProcessingBid] = useState(false);
    const [showVerifyNotice, setShowVerifyNotice] = useState(false);

    // Handover & Agreement State
    const [agreement, setAgreement] = useState<any>(null);
    const [handover, setHandover] = useState<any>(null);
    const [showAgreementPopup, setShowAgreementPopup] = useState(false);
    const [showHandoverPopup, setShowHandoverPopup] = useState(false);
    const [showReviewPopup, setShowReviewPopup] = useState(false);
    const [ratingMode, setRatingMode] = useState<'freelancer' | 'client'>('freelancer');
    const searchParams = useSearchParams();

    useEffect(() => {
        loadBids();
        loadAgreementAndHandover();

        // Handle deep-linking from notifications
        const action = searchParams.get('action');
        if (action === 'agreement') setShowAgreementPopup(true);
        if (action === 'handover-upload') setShowHandoverPopup(true);
        if (action === 'handover-review') setShowReviewPopup(true);
        if (action === 'rate') {
            setRatingMode('freelancer');
            setShowReviewPopup(true);
        }
        if (action === 'rate-client') {
            setRatingMode('client');
            setShowReviewPopup(true);
        }
    }, [project._id, searchParams]);

    const loadAgreementAndHandover = async () => {
        const [agreementData, handoverData] = await Promise.all([
            getProjectAgreement(project._id),
            getProjectHandover(project._id)
        ]);
        if (agreementData.success) setAgreement(agreementData.agreement);
        if (handoverData.success) setHandover(handoverData.handover);
    };

    const loadBids = async () => {
        setIsLoadingBids(true);
        const data = await getProjectBids(project._id);
        setBids(data);
        setIsLoadingBids(false);
    };

    const handleAcceptBid = async (bidId: string) => {
        if (!confirm("Are you sure you want to accept this bid? This will close the project.")) return;
        setIsProcessingBid(true);
        const res = await acceptBid(bidId);
        if (res.success) {
            loadBids();
        } else {
            alert(res.error || "Failed to accept bid");
        }
        setIsProcessingBid(false);
    };

    const handleRejectBid = async (bidId: string) => {
        if (!confirm("Are you sure you want to reject this bid?")) return;
        setIsProcessingBid(true);
        const res = await rejectBid(bidId);
        if (res.success) {
            loadBids();
        } else {
            alert(res.error || "Failed to reject bid");
        }
        setIsProcessingBid(false);
    };

    if (!project) return <div>Project not found</div>;

    const client = project.createdBy || {};
    const isOwner = user?.id === (client._id || client);
    const isFreelancer = user?.role === "freelancer" || user?.role === "both";
    const acceptedBid = bids.find(b => b.status === 'accepted');
    const isAcceptedFreelancer = acceptedBid && (acceptedBid.freelancerId?._id === user?.id || acceptedBid.freelancerId === user?.id);
    const hasAlreadyBid = bids.some(b => b.freelancerId?._id === user?.id || b.freelancerId === user?.id);

    return (
        <div className="h-full bg-background overflow-y-auto pb-20">
            {/* Verification Notice */}
            {user && !user.verification?.email && (
                <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <p className="text-sm font-medium text-orange-600">
                            Please verify your email to submit proposals to this project.
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
                                {project.title}
                            </h1>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                handover?.status === 'accepted'
                                    ? "bg-zinc-100 text-zinc-900 border-zinc-200"
                                    : acceptedBid
                                        ? "bg-purple-500 text-white border-purple-400"
                                        : "bg-green-500/10 text-green-600 border-green-500/20"
                            )}>
                                {handover?.status === 'accepted' ? "CLOSED" : acceptedBid ? "AWARDED" : "OPEN"}
                            </span>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-2">
                                <button className="p-2.5 hover:bg-muted rounded-full transition-colors border border-border text-muted-foreground hover:text-foreground">
                                    <Share2 className="h-5 w-5" />
                                </button>
                                <BookmarkButton
                                    itemId={project._id}
                                    itemType="project"
                                    initialSavedState={isSaved}
                                    activeColor="text-purple-500"
                                    className="p-2.5 hover:bg-muted border border-border text-muted-foreground hover:text-foreground rounded-full"
                                />
                                <div className="bg-muted px-6 py-2 rounded-xl border border-border ml-2 flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        {acceptedBid ? "Final Price" : "Average Bid"}
                                    </span>
                                    <span className="text-2xl font-black text-foreground">
                                        ${acceptedBid ? acceptedBid.bidAmount : (bids.length > 0 ? Math.round(bids.reduce((acc, b) => acc + (b.bidAmount || 0), 0) / bids.length) : "0")}
                                    </span>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-2">
                                {timeAgo(project.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
                    {/* LEFT CONTENT (70%) */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* TABS */}
                        <div className="flex border-b border-border gap-8">
                            {["Details", "Bids", ...(acceptedBid && (isOwner || isAcceptedFreelancer) ? ["Project Files"] : [])].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={cn(
                                        "pb-4 text-sm font-bold transition-all relative",
                                        activeTab === tab
                                            ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {tab === "Bids" ? `Bids (${bids.length})` : tab}
                                </button>
                            ))}
                        </div>

                        {activeTab === "Details" ? (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-400">
                                {/* Description */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Project Description
                                    </h3>
                                    <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-base">
                                        {project.description}
                                    </p>
                                </div>

                                {/* Skills */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Award className="h-5 w-5 text-primary" />
                                        Skills Required
                                    </h3>
                                    <div className="flex flex-wrap gap-2.5">
                                        {project.skills?.map((skill: string) => (
                                            <span key={skill} className="px-4 py-1.5 rounded-lg bg-secondary/50 text-secondary-foreground text-sm font-bold border border-border shadow-sm">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Meta Info */}
                                <div className="grid grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border border-border/50">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Role Type</div>
                                        <div className="font-bold text-foreground">{project.jobTitles?.join(", ") || "Diverse"}</div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === "Project Files" ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
                                {/* Header / Status */}
                                <div className="flex items-center justify-between bg-purple-500/5 border border-purple-500/10 p-6 rounded-2xl">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                            <ShieldCheck className="h-5 w-5 text-purple-500" />
                                            Project Deliverables
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {handover?.status === 'accepted'
                                                ? "Project completed. All files are available below."
                                                : handover?.status === 'submitted'
                                                    ? "Files are currently being reviewed by the client."
                                                    : "Finalize the agreement to start the handover process."}
                                        </p>
                                    </div>

                                    {isAcceptedFreelancer && (
                                        <button
                                            onClick={() => {
                                                if (!agreement?.clientSigned || !agreement?.freelancerSigned) {
                                                    setShowAgreementPopup(true);
                                                } else {
                                                    setShowHandoverPopup(true);
                                                }
                                            }}
                                            disabled={handover?.status === 'accepted'}
                                            className={cn(
                                                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all border shadow-lg active:scale-95",
                                                handover?.status === 'accepted'
                                                    ? "bg-green-500/10 text-green-600 border-green-500/20 cursor-not-allowed"
                                                    : "bg-purple-500 text-white hover:bg-purple-600 border-purple-500 shadow-purple-500/20"
                                            )}
                                        >
                                            {handover?.status === 'accepted' ? "✓ Handover Complete" : "Handover Files"}
                                        </button>
                                    )}

                                    {isOwner && handover?.status && handover.status !== 'draft' && (
                                        <button
                                            onClick={() => setShowReviewPopup(true)}
                                            className={cn(
                                                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all border shadow-lg active:scale-95",
                                                handover.status === 'accepted'
                                                    ? "bg-green-500/10 text-green-600 border-green-500/20 shadow-green-500/10"
                                                    : "bg-purple-500 text-white hover:bg-purple-600 border-purple-500 shadow-purple-500/20"
                                            )}
                                        >
                                            {handover.status === 'accepted' ? "✓ Work Accepted" : "Review Handover"}
                                        </button>
                                    )}

                                    {/* Freelancer Rate Client Button */}
                                    {!isOwner && handover?.status === 'accepted' && (
                                        <button
                                            onClick={() => {
                                                setRatingMode('client');
                                                setShowReviewPopup(true);
                                            }}
                                            disabled={handover.freelancerHasRated}
                                            className={cn(
                                                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all border shadow-lg",
                                                handover.freelancerHasRated
                                                    ? "bg-green-500/10 text-green-600 border-green-500/20 shadow-green-500/10 cursor-not-allowed"
                                                    : "bg-purple-500 text-white hover:bg-purple-600 border-purple-500 shadow-purple-500/20 active:scale-95"
                                            )}
                                        >
                                            {handover.freelancerHasRated ? "✓ Rated" : "Rate Client"}
                                        </button>
                                    )}
                                </div>

                                {/* Agreement Status (Mini Banner) */}
                                {(!agreement?.clientSigned || !agreement?.freelancerSigned) && (
                                    <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            <p className="text-xs font-medium text-amber-700">
                                                {!agreement?.clientSigned && !agreement?.freelancerSigned
                                                    ? "Both parties must sign the project agreement."
                                                    : !agreement?.clientSigned
                                                        ? "Waiting for client to sign the agreement."
                                                        : "Waiting for freelancer to sign the agreement."}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowAgreementPopup(true)}
                                            className="text-[10px] font-black uppercase tracking-widest text-amber-700 hover:underline"
                                        >
                                            View Agreement
                                        </button>
                                    </div>
                                )}

                                {/* Files Grid */}
                                {handover && handover.files?.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {handover.files.map((file: any, index: number) => (
                                            <div key={index} className="group relative bg-card border border-border rounded-xl p-4 transition-all hover:shadow-lg hover:border-purple-500/20">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-muted rounded-xl text-muted-foreground group-hover:text-purple-500 transition-colors">
                                                        <File className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold truncate">
                                                            {file.fileUrl.split('/').pop() || 'Deliverable'}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                                {file.format || 'FILE'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <a
                                                            href={file.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                        <a
                                                            href={file.fileUrl}
                                                            download
                                                            className="p-2 hover:bg-muted rounded-lg text-purple-500"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-muted/20">
                                        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                        <p className="text-muted-foreground font-medium">No project files submitted yet.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                                <div className="flex flex-col items-end gap-3">
                                    <h3 className="text-xl font-bold">Proposals</h3>
                                    {isFreelancer && !isOwner && project.status === "open" && !hasAlreadyBid && (
                                        <div className="flex flex-col items-end gap-3">
                                            <button
                                                onClick={() => {
                                                    if (!user?.verification?.email) {
                                                        setShowVerifyNotice(true);
                                                    } else {
                                                        setShowBidModal(true);
                                                    }
                                                }}
                                                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all shadow-md"
                                            >
                                                Submit Proposal
                                            </button>
                                            {showVerifyNotice && !user?.verification?.email && (
                                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 animate-in slide-in-from-top-2 duration-300">
                                                    <div className="flex flex-col gap-2">
                                                        <p className="text-sm font-bold flex items-center gap-2">
                                                            <AlertCircle className="h-4 w-4" />
                                                            Verify your email to submit a proposal
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

                                {isLoadingBids ? (
                                    <div className="flex justify-center p-20">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {bids.length === 0 ? (
                                            <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-muted/20">
                                                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                                <p className="text-muted-foreground font-medium">No bids submitted yet.</p>
                                            </div>
                                        ) : (
                                            bids.map((bid) => (
                                                <BidCard
                                                    key={bid._id}
                                                    bid={bid}
                                                    isOwner={isOwner}
                                                    onAccept={handleAcceptBid}
                                                    onReject={handleRejectBid}
                                                    isProcessing={isProcessingBid}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL (30%) */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sticky top-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Client Info</h3>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 border-2 border-border shadow-sm">
                                        {client.profileImageUrl || client.avatarUrl ? (
                                            <img src={client.profileImageUrl || client.avatarUrl} alt={client.username} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-lg font-black uppercase">
                                                {client.firstName?.[0]}{client.lastName?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-black text-lg text-foreground truncate">{client.firstName} {client.lastName}</div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" /> {client.country || "Remote"}
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href={`/profile/${client.username}`}
                                    className="w-full py-2.5 flex items-center justify-center rounded-lg text-xs font-black bg-secondary text-secondary-foreground hover:bg-muted transition-colors uppercase tracking-widest border border-border"
                                >
                                    View Full Profile
                                </Link>

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
                                    onClick={() => window.location.href = `/user/${client.username}`}
                                    className="w-full py-2.5 rounded-lg text-xs font-black bg-secondary text-secondary-foreground hover:bg-muted transition-colors uppercase tracking-widest border border-border"
                                >
                                    View Full Profile
                                </button>
                            </div>

                            {/* Similar Projects - Minor Sidebar Item */}
                            {similarProjects?.length > 0 && (
                                <div className="mt-10 pt-10 border-t border-border">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Similar Projects</h3>
                                    <div className="space-y-4">
                                        {similarProjects.slice(0, 3).map((p) => (
                                            <div key={p._id} className="group cursor-pointer">
                                                <div className="font-bold text-xs group-hover:text-primary transition-colors line-clamp-1">{p.title}</div>
                                                <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                                                    <span className="font-bold text-foreground">${p.budget}</span>
                                                    <span>Fixed Price</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div >

            {/* BID MODAL */}
            {
                showBidModal && (
                    <SubmitBidModal
                        project={project}
                        user={user}
                        onClose={() => setShowBidModal(false)}
                        onSuccess={() => {
                            loadBids();
                            alert("Your proposal has been submitted successfully!");
                        }}
                    />
                )
            }

            {/* HANDOVER POPUPS */}
            {
                showAgreementPopup && (
                    <ProjectAgreementPopup
                        projectId={project._id}
                        bidId={acceptedBid?._id}
                        userType={isOwner ? "client" : "freelancer"}
                        onClose={() => setShowAgreementPopup(false)}
                        onSign={loadAgreementAndHandover}
                    />
                )
            }

            {
                showHandoverPopup && (
                    <ProjectHandoverPopup
                        projectId={project._id}
                        initialHandover={handover}
                        onClose={() => setShowHandoverPopup(false)}
                        onSubmit={loadAgreementAndHandover}
                    />
                )
            }

            {
                showReviewPopup && (
                    <ProjectReviewPopup
                        projectId={project._id}
                        handover={handover}
                        onClose={() => setShowReviewPopup(false)}
                        onStatusUpdate={loadAgreementAndHandover}
                        ratingMode={ratingMode}
                        clientData={
                            ratingMode === 'client' ? {
                                clientId: typeof project.createdBy === 'object' ? project.createdBy._id : project.createdBy,
                                clientUsername: typeof project.createdBy === 'object' ? project.createdBy.username : 'Client',
                                projectTitle: project.title,
                                price: project.budget || 0
                            } : undefined
                        }
                    />
                )
            }
        </div >
    );
}
