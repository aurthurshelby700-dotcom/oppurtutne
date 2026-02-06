"use client";

import Image from "next/image";
import { UserCircle, Star, Heart, CheckCircle, XCircle, Trophy, Film, FileText, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMAGE_FORMATS, VIDEO_FORMATS, DOCUMENT_FORMATS } from "@/lib/constants";
import Link from "next/link";

interface EntryCardProps {
    entry: any;
    isOwner: boolean;
    onAward?: (entryId: string) => void;
    onReject?: (entryId: string) => void;
    onLike?: (entryId: string) => void;
    onClick?: (entry: any) => void;
    isProcessing?: boolean;
}

export function EntryCard({ entry, isOwner, onAward, onReject, onLike, onClick, isProcessing }: EntryCardProps) {
    const freelancer = entry.freelancerId || {};
    const username = freelancer.username || "unknown";

    return (
        <div
            onClick={() => onClick?.(entry)}
            className={cn(
                "group relative bg-card border rounded-xl overflow-hidden transition-all shadow-sm flex flex-col cursor-pointer",
                entry.status === "awarded" ? "border-amber-500 ring-1 ring-amber-500" : "border-border hover:border-primary/50"
            )}
        >
            {/* Image Preview - Fixed 4:3 Aspect Ratio */}
            <div className="relative aspect-[4/3] bg-muted overflow-hidden flex items-center justify-center">
                {(() => {
                    const primaryFile = entry.files?.[0];
                    const fileUrl = primaryFile?.fileUrl || entry.fileUrl;
                    const format = primaryFile?.format || entry.format || 'jpg';

                    if (IMAGE_FORMATS.includes(format.toLowerCase())) {
                        return (
                            <Image
                                src={fileUrl}
                                alt={`Entry #${entry.entryNumber || entry._id.substring(0, 4)}`}
                                fill
                                unoptimized={true}
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        );
                    } else if (VIDEO_FORMATS.includes(format.toLowerCase())) {
                        return (
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-4 bg-primary/10 rounded-full text-primary animate-pulse">
                                    <Film className="h-8 w-8" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Video Entry</span>
                            </div>
                        );
                    } else if (DOCUMENT_FORMATS.includes(format.toLowerCase())) {
                        return (
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-4 bg-orange-500/10 rounded-full text-orange-500">
                                    <FileText className="h-8 w-8" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Document</span>
                            </div>
                        );
                    } else {
                        return (
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-4 bg-purple-500/10 rounded-full text-purple-500">
                                    <Layers className="h-8 w-8" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{format.toUpperCase()} Source</span>
                            </div>
                        );
                    }
                })()}

                {/* File Count Badge */}
                {entry.files?.length > 1 && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                        +{entry.files.length - 1} More
                    </div>
                )}

                {/* Overlay with Entry Number */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-background/80 backdrop-blur-md rounded text-[10px] font-black uppercase tracking-widest border border-border/50">
                    #{entry.entryNumber || entry._id.substring(entry._id.length - 4)}
                </div>

                {/* Status Badges */}
                {entry.status === "awarded" && (
                    <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
                        <div className="bg-amber-500 text-white px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2">
                            <Trophy className="h-4 w-4" /> Winner
                        </div>
                    </div>
                )}
            </div>

            {/* Info Area */}
            <div className="p-4 space-y-3">
                <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border">
                            {freelancer.profileImageUrl || freelancer.avatarUrl ? (
                                <Image src={freelancer.profileImageUrl || freelancer.avatarUrl} alt={username} width={24} height={24} unoptimized={true} className="h-full w-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-[8px] font-black uppercase">
                                    {username.slice(0, 2)}
                                </div>
                            )}
                        </div>
                        <Link
                            href={`/profile/${username}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-bold text-foreground truncate hover:text-primary transition-colors hover:underline"
                        >
                            {username}
                        </Link>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-black text-amber-500">
                        <Star className="h-3 w-3 fill-amber-500" />
                        {entry.rating || 0}
                    </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onLike?.(entry._id);
                        }}
                        className="flex items-center gap-1.5 text-[10px] font-black hover:text-red-500 transition-colors"
                    >
                        <Heart className={cn("h-3.5 w-3.5", entry.isLiked ? "text-red-500 fill-red-500" : "text-muted-foreground")} />
                        {entry.likesCount || 0}
                    </button>

                    {isOwner && entry.status === "active" && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReject?.(entry._id);
                                }}
                                disabled={isProcessing}
                                className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors border border-destructive/10"
                            >
                                <XCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAward?.(entry._id);
                                }}
                                disabled={isProcessing}
                                className="p-1.5 bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-colors shadow-sm"
                            >
                                <Trophy className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    {entry.status === "rejected" && (
                        <span className="text-[8px] font-black text-destructive uppercase tracking-widest bg-destructive/10 px-2 py-0.5 rounded">
                            Rejected
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
