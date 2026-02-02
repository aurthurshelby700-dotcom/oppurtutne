import { UserCircle, MapPin, CheckCircle, ShieldCheck, Star, Smartphone, Mail, CreditCard } from "lucide-react";
import { getPublicUserProfile } from "@/lib/actions/user";
import { getFriendshipStatus } from "@/lib/actions/friends";
import { checkIsSaved } from "@/lib/actions/saved";
import { notFound } from "next/navigation";
import FriendActionButton from "@/components/profile/FriendActionButton";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BookmarkButton } from "@/components/shared/BookmarkButton";

// Reuse verification icon helper
const VerificationIcon = ({
    isVerified,
    icon: Icon,
    label
}: {
    isVerified: boolean;
    icon: any;
    label: string;
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <div className={cn(
                "p-2 rounded-full transition-colors cursor-help",
                isVerified ? "bg-green-100 dark:bg-green-900/20 text-green-600" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}>
                <Icon className="h-5 w-5" />
            </div>
        </TooltipTrigger>
        <TooltipContent className="p-3 text-center max-w-[200px]">
            <p className="font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground my-1">
                {isVerified ? "Verified" : "Not Verified"}
            </p>
        </TooltipContent>
    </Tooltip>
);

export default async function PublicProfilePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    // Fetch data in parallel
    const [profile, friendStatus, isSaved] = await Promise.all([
        getPublicUserProfile(id),
        getFriendshipStatus(id),
        checkIsSaved(id)
    ]);

    if (!profile) return notFound();

    const coverImage = profile.cover_url || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop';

    // Mock extended data for public view (same as private for now)
    const MOCK_EXTENDED_DATA = {
        username: "@" + (profile.name?.toLowerCase().replace(/\s/g, '_') || "user"),
        verification: {
            identity: true,
            email: true,
            phone: false,
            payment: false
        },
        reviews: [
            { id: 1, client: "Acme Corp", rating: 5, text: "Delivered exceptional work on our branding project. Highly recommended!", date: "2 days ago" },
            { id: 2, client: "StartUp Inc", rating: 4.8, text: "Great communication and very skilled.", date: "1 week ago" }
        ],
        education: [
            { id: 1, degree: "BFA in Design", school: "Design University", year: "2018-2022" }
        ],
        portfolio: [
            { id: 1, title: "Fintech Dashboard", category: "UI/UX", image: "bg-blue-500/10" },
            { id: 2, title: "Brand Identity", category: "Branding", image: "bg-green-500/10" },
        ]
    };

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background pb-20">
                {/* 1. HEADER SECTION */}
                <div className="relative w-full group/cover bg-neutral-900">
                    {/* Cover Image */}
                    <div className="relative w-full aspect-[21/3] max-h-[500px] overflow-hidden">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${coverImage})` }}
                        ></div>
                        <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-black/80 to-transparent"></div>
                    </div>

                    {/* Identity Content - Overlaid at bottom */}
                    <div className="absolute bottom-0 w-full px-6 md:px-12 pb-6 flex items-end gap-6">
                        {/* Avatar */}
                        <div className="relative shrink-0 mb-2 z-50">
                            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-black/50 bg-neutral-800 flex items-center justify-center overflow-hidden shadow-2xl relative z-10">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
                                ) : (
                                    <UserCircle className="h-full w-full text-neutral-400 p-2" />
                                )}
                            </div>
                        </div>

                        {/* Text Details Area */}
                        <div className="flex-1 text-white pb-6 flex justify-between items-end">
                            <div className="flex flex-col justify-end">
                                <h1 className="text-4xl font-bold tracking-tight shadow-sm mb-1">
                                    {profile.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base md:text-lg text-white/90 font-medium">
                                    <span className="opacity-80">{MOCK_EXTENDED_DATA.username}</span>
                                    <span className="opacity-40 hidden sm:inline">•</span>
                                    <span className="text-purple-300">
                                        {profile.title}
                                    </span>
                                    {profile.location && (
                                        <>
                                            <span className="opacity-40 hidden sm:inline">•</span>
                                            <span className="flex items-center gap-1 opacity-80">
                                                <MapPin className="h-4 w-4" /> {profile.location}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Friend Action Button - Only show if not self (logic handled by parent check or component) */}
                            {friendStatus !== null && (
                                <div className="mb-2 flex items-center gap-3">
                                    <FriendActionButton
                                        targetUserId={profile.id}
                                        initialStatus={friendStatus}
                                    />
                                    <BookmarkButton
                                        itemId={profile.id}
                                        itemType="freelancer"
                                        activeColor="text-indigo-500"
                                        className="bg-black/40 text-white/80 hover:bg-black/60 hover:text-white p-3 backdrop-blur-sm"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. MAIN CONTENT AREA (Simplified for public view) */}
                <div className="max-w-7xl mx-auto px-6 py-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Col: Info */}
                        <div className="md:col-span-2 space-y-8">
                            {/* About */}
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <h2 className="text-xl font-semibold mb-4">About</h2>
                                <p className="text-foreground/80 leading-relaxed text-lg">
                                    {profile.bio || "No bio available."}
                                </p>
                            </div>

                            {/* Skills */}
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <h2 className="text-xl font-semibold mb-4">Skills</h2>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills && profile.skills.length > 0 ? (
                                        profile.skills.map(skill => (
                                            <span key={skill} className="bg-secondary/40 text-foreground px-4 py-2 rounded-lg text-sm font-medium border border-border">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground italic">No skills listed.</span>
                                    )}
                                </div>
                            </div>

                            {/* Reviews Preview (Mock) */}
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <h2 className="text-xl font-semibold mb-4">Latest Reviews</h2>
                                <div className="space-y-4">
                                    {MOCK_EXTENDED_DATA.reviews.map(review => (
                                        <div key={review.id} className="pb-4 border-b border-border last:border-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-medium">{review.client}</span>
                                                <div className="flex text-amber-500">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={cn("h-3 w-3 fill-current", i >= Math.floor(review.rating) && "opacity-30")} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-foreground/70 italic">"{review.text}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Col: Verification & Stats */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="bg-card border border-border rounded-xl p-5 shadow-sm sticky top-24">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Verifications</h3>
                                <div className="grid grid-cols-4 gap-3 pb-4 border-b border-border">
                                    <VerificationIcon type="identity" icon={ShieldCheck} isVerified={MOCK_EXTENDED_DATA.verification.identity} label="Identity" />
                                    <VerificationIcon type="email" icon={Mail} isVerified={MOCK_EXTENDED_DATA.verification.email} label="Email" />
                                    <VerificationIcon type="phone" icon={Smartphone} isVerified={MOCK_EXTENDED_DATA.verification.phone} label="Phone" />
                                    <VerificationIcon type="payment" icon={CreditCard} isVerified={MOCK_EXTENDED_DATA.verification.payment} label="Payment" />
                                </div>
                                <div className="mt-4 pt-2 text-center">
                                    <span className="text-xs text-muted-foreground block">Member since {new Date(profile.created_at || Date.now()).getFullYear()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
