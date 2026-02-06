"use client";

import { useState, useEffect } from "react";
import { getReviews } from "@/lib/actions/reviews";
import ReviewCard from "@/components/profile/ReviewCard";
import { Loader2, MessageSquare } from "lucide-react";

export function ProfileTabs({ profile, isOwner }: { profile: any; isOwner: boolean }) {
    const [activeTab, setActiveTab] = useState<"profile" | "portfolio" | "reviews">("profile");

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Tab Headers */}
            <div className="border-b border-border">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "profile"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab("portfolio")}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "portfolio"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Portfolio
                    </button>
                    <button
                        onClick={() => setActiveTab("reviews")}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "reviews"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Reviews
                    </button>
                </div>
            </div>

            <div className="p-6">
                {activeTab === "profile" && <ProfileTabContent profile={profile} />}
                {activeTab === "portfolio" && <PortfolioTabContent isOwner={isOwner} />}
                {activeTab === "reviews" && <ReviewsTabContent username={profile.username} />}
            </div>
        </div>
    );
}

// PROFILE TAB CONTENT
function ProfileTabContent({ profile }: { profile: any }) {
    return (
        <div className="space-y-6">
            {/* First Name */}
            {profile.firstName && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">First Name</h3>
                    <p className="text-base text-foreground">{profile.firstName}</p>
                </div>
            )}

            {/* Last Name */}
            {profile.lastName && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Name</h3>
                    <p className="text-base text-foreground">{profile.lastName}</p>
                </div>
            )}

            {/* Bio */}
            {profile.bio && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Bio</h3>
                    <p className="text-base text-foreground leading-relaxed">{profile.bio}</p>
                </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill: string) => (
                            <span
                                key={skill}
                                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Price Per Hour */}
            {profile.pricePerHour !== undefined && profile.pricePerHour !== null && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Price Per Hour</h3>
                    <p className="text-2xl font-bold text-foreground">
                        ${profile.pricePerHour}
                        <span className="text-base font-normal text-muted-foreground">/hr</span>
                    </p>
                </div>
            )}

            {/* Role */}
            {profile.role && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Role</h3>
                    <div className="flex gap-2">
                        {profile.role === 'both' ? (
                            <>
                                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                                    Freelancer
                                </span>
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                                    Client
                                </span>
                            </>
                        ) : profile.role === 'freelancer' ? (
                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                                Freelancer
                            </span>
                        ) : profile.role === 'client' ? (
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                                Client
                            </span>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}

// PORTFOLIO TAB CONTENT (PLACEHOLDER)
function PortfolioTabContent({ isOwner }: { isOwner: boolean }) {
    return (
        <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">No portfolio items yet</p>
            {isOwner && (
                <button
                    disabled
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-md text-sm font-medium cursor-not-allowed opacity-60"
                >
                    Add Portfolio (Coming Soon)
                </button>
            )}
        </div>
    );
}

// REVIEWS TAB CONTENT
function ReviewsTabContent({ username }: { username: string }) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            setIsLoading(true);
            try {
                const result = await getReviews(username);
                if (result.success) {
                    setReviews(result.reviews);
                }
            } catch (error) {
                console.error("Error fetching reviews:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, [username]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50 mb-4" />
                <p className="text-sm text-muted-foreground font-medium">Fetching reviews...</p>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-6">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No Reviews Yet</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                    This user hasn't received any feedback yet. Completed projects and contests will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
            ))}
        </div>
    );
}
