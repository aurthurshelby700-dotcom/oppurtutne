"use client";

import Image from "next/image";
import { UserCircle, Clock, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface BidCardProps {
    bid: any;
    isOwner: boolean;
    onAccept?: (bidId: string) => void;
    onReject?: (bidId: string) => void;
    isProcessing?: boolean;
}

export function BidCard({ bid, isOwner, onAccept, onReject, isProcessing }: BidCardProps) {
    const freelancer = bid.freelancerId || {};
    const fullName = freelancer.name || `${freelancer.firstName} ${freelancer.lastName}` || "Unknown Freelancer";

    return (
        <div className={cn(
            "bg-card border rounded-xl p-5 transition-all shadow-sm flex flex-col gap-4",
            bid.status === "accepted" ? "border-green-500 bg-green-50/5" : "border-border hover:border-primary/50"
        )}>
            <div className="flex justify-between items-start gap-4">
                {/* Freelancer Profile Summary */}
                <Link href={`/profile/${freelancer.username}`} className="flex items-center gap-3 group/link">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border group-hover/link:border-primary transition-colors">
                        {freelancer.profileImageUrl || freelancer.avatarUrl ? (
                            <Image
                                src={freelancer.profileImageUrl || freelancer.avatarUrl}
                                alt={fullName}
                                width={48}
                                height={48}
                                unoptimized={true}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-black">
                                {fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-foreground group-hover/link:text-primary transition-colors">{fullName}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                                ⭐ {freelancer.rating || 0} ({freelancer.reviewsCount || 0} reviews)
                            </span>
                        </div>
                    </div>
                </Link>

                {/* Amount & Time */}
                <div className="text-right">
                    <div className="flex items-center gap-1 justify-end font-bold text-lg text-foreground">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        {bid.bidAmount}
                    </div>
                    <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {bid.days} Days delivery
                    </div>
                </div>
            </div>

            {/* Proposal Summary */}
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-3">
                {bid.proposal}
            </div>

            {/* Status or Actions */}
            <div className="flex items-center justify-between mt-2 pt-4 border-t border-border/50">
                <div>
                    {bid.status === "accepted" && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-100/50 px-3 py-1 rounded-full border border-green-200 uppercase tracking-wider">
                            <CheckCircle className="h-3.5 w-3.5" /> Accepted
                        </span>
                    )}
                    {bid.status === "rejected" && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-destructive bg-destructive/5 px-3 py-1 rounded-full border border-destructive/20 uppercase tracking-wider">
                            <XCircle className="h-3.5 w-3.5" /> Rejected
                        </span>
                    )}
                    {bid.status === "pending" && (
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1 bg-muted rounded-full">
                            Pending
                        </span>
                    )}
                </div>

                {isOwner && bid.status === "pending" && (
                    <div className="flex items-center gap-2">
                        <button
                            disabled={isProcessing}
                            onClick={() => onReject?.(bid._id)}
                            className="px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-destructive/20 disabled:opacity-50"
                        >
                            Reject
                        </button>
                        <button
                            disabled={isProcessing}
                            onClick={() => onAccept?.(bid._id)}
                            className="px-4 py-2 text-xs font-bold bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                            Accept Bid
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
