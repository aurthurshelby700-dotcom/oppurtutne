import { Star, Clock } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/shared/UserAvatar";

interface ReviewCardProps {
    review: {
        _id: string;
        reviewerUserId: {
            _id: string;
            username: string;
            profileImageUrl?: string;
            avatarUrl?: string;
            firstName?: string;
            lastName?: string;
        };
        relatedType: "project" | "contest";
        relatedId: string;
        relatedTitle: string;
        rating: number;
        reviewText: string;
        price: number;
        createdAt: string;
    };
}

export default function ReviewCard({ review }: ReviewCardProps) {
    const reviewer = review.reviewerUserId;

    return (
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
            {/* TOP ROW */}
            <div className="flex items-center justify-between">
                <Link href={`/profile/${reviewer.username}`} className="flex items-center gap-3 group">
                    <UserAvatar user={reviewer} className="h-10 w-10" />
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            @{reviewer.username}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                            {review.relatedType} Client
                        </span>
                    </div>
                </Link>
                <div className="text-xs font-medium text-muted-foreground">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </div>
            </div>

            {/* SECOND ROW: Context */}
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {review.relatedType === "project" ? "Project" : "Contest"}
                </span>
                <Link
                    href={`/${review.relatedType}/${review.relatedId}`}
                    className="font-bold text-foreground text-sm hover:text-primary transition-colors line-clamp-1"
                >
                    {review.relatedTitle}
                </Link>
            </div>

            {/* THIRD ROW: Rating */}
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={cn(
                            "h-4 w-4",
                            star <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"
                        )}
                    />
                ))}
            </div>

            {/* FOURTH ROW: Text */}
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {review.reviewText}
            </div>

            {/* FOOTER */}
            <div className="pt-3 mt-auto border-t border-border/50 flex items-center justify-between">
                <div className="text-sm font-bold text-foreground">
                    ${review.price.toLocaleString()}
                </div>
                <div className="px-2 py-1 rounded bg-muted text-[10px] font-bold uppercase text-muted-foreground">
                    {review.relatedType}
                </div>
            </div>
        </div>
    );
}
