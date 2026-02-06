import { notFound, redirect } from "next/navigation";
import User from "@/models/User";
import connectToDatabase from "@/lib/db";
import { auth } from "@/auth";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ShareProfileButton } from "@/components/profile/ShareProfileButton";
import { ProfileContainer } from "@/components/profile/ProfileContainer";
import { ProfileBanner } from "@/components/profile/ProfileBanner";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ShieldCheck, Smartphone, Mail, CreditCard, Star } from "lucide-react";

export default async function ProfilePage(props: { params: Promise<{ username: string }> }) {
    const params = await props.params;
    const { username } = params;

    await connectToDatabase();

    // Fetch user by username
    const profile = await User.findOne({ username: username.toLowerCase() }).lean();

    if (!profile) return notFound();

    // Check if profile is completed
    if (!profile.profileCompleted) {
        redirect("/setup-profile");
    }

    // Determine ownership
    const session = await auth();
    const isOwner = session?.user?.email === profile.email;

    // Serialize profile data to plain object for client components
    const serializedProfile = {
        username: profile.username,
        firstName: profile.firstName || null,
        lastName: profile.lastName || null,
        email: profile.email,
        role: profile.role || null,
        jobTitle: profile.jobTitles?.[0] || null,
        bio: profile.bio || null,
        skills: profile.skills || [],
        pricePerHour: profile.pricePerHour || null,
        country: profile.country || null,
        mobileNumber: profile.mobileNumber || null,
        avatarUrl: profile.avatarUrl || null,
        coverUrl: profile.coverUrl || null,
        profileImageUrl: profile.profileImageUrl || null,
        bannerImageUrl: profile.bannerImageUrl || null,
        emailVerified: profile.verification?.email || false,
        identityVerified: profile.verification?.identity || false,
        paymentVerified: profile.verification?.payment || false,
        profileCompleted: profile.profileCompleted || false,
        rating: profile.rating || 0,
        reviewsCount: profile.reviewsCount || 0,
        createdAt: profile.createdAt ? profile.createdAt.toISOString() : null,
    };


    return (
        <ProfileContainer>
            {/* SECTION 1: PROFILE HEADER */}
            <div className="relative">
                {/* Banner Image */}
                <ProfileBanner
                    initialUrl={serializedProfile.bannerImageUrl}
                    isOwner={isOwner}
                    username={serializedProfile.username}
                />

                {/* Profile Info Container */}
                <div className="max-w-7xl mx-auto px-6">
                    <div className="relative -mt-20 pb-6">
                        {/* Profile Picture */}
                        <div className="mb-4">
                            <ProfileAvatar
                                initialUrl={serializedProfile.profileImageUrl}
                                isOwner={isOwner}
                                username={serializedProfile.username}
                                firstName={serializedProfile.firstName || undefined}
                            />
                        </div>

                        {/* Username, Job Title, Country */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                                    @{serializedProfile.username}
                                    {serializedProfile.emailVerified && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-bold border border-green-500/20">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            Verified
                                        </div>
                                    )}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-bold text-sm">
                                            {serializedProfile.rating > 0 ? serializedProfile.rating.toFixed(1) : "No ratings"}
                                        </span>
                                        <span className="text-muted-foreground text-xs font-medium ml-1">
                                            ({serializedProfile.reviewsCount} {serializedProfile.reviewsCount === 1 ? 'review' : 'reviews'})
                                        </span>
                                    </div>
                                    <span className="text-muted-foreground">•</span>
                                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                                        {serializedProfile.role === 'both' ? 'Freelancer & Client' : serializedProfile.role === 'freelancer' ? 'Freelancer' : 'Client'}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                                    {serializedProfile.jobTitle && (
                                        <span className="text-lg">{serializedProfile.jobTitle}</span>
                                    )}
                                    {serializedProfile.jobTitle && serializedProfile.country && (
                                        <span>•</span>
                                    )}
                                    {serializedProfile.country && (
                                        <span className="text-lg">{serializedProfile.country}</span>
                                    )}
                                </div>
                            </div>

                            {/* SECTION 2: ACTION BUTTONS */}
                            <div className="flex gap-3">
                                {isOwner ? (
                                    <>
                                        <EditProfileModal user={serializedProfile} />
                                        <ShareProfileButton />
                                    </>
                                ) : (
                                    <>
                                        <button className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium">
                                            Add Friend
                                        </button>
                                        <ShareProfileButton />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-7xl mx-auto px-6 py-8 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Tabs Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* SECTION 4: TABS */}
                        <ProfileTabs profile={serializedProfile} isOwner={isOwner} />
                    </div>

                    {/* RIGHT COLUMN: Verification Panel */}
                    <div className="lg:col-span-1">
                        {/* SECTION 3: VERIFICATION PANEL */}
                        <VerificationPanel
                            emailVerified={serializedProfile.emailVerified}
                            mobileVerified={false}
                            identityVerified={serializedProfile.identityVerified}
                            paymentVerified={serializedProfile.paymentVerified}
                            isOwner={isOwner}
                        />
                    </div>
                </div>
            </div>
        </ProfileContainer>
    );
}



// SECTION 3: VERIFICATION PANEL COMPONENT
function VerificationPanel({
    emailVerified,
    mobileVerified,
    identityVerified,
    paymentVerified,
    isOwner
}: {
    emailVerified: boolean;
    mobileVerified: boolean;
    identityVerified: boolean;
    paymentVerified: boolean;
    isOwner: boolean;
}) {
    const verifications = [
        { label: "Email Verification", verified: emailVerified, icon: Mail, url: "/verification" },
        { label: "Mobile Verification", verified: mobileVerified, icon: Smartphone, url: "/verification" },
        { label: "Identity Verification", verified: identityVerified, icon: ShieldCheck, url: "/verification" },
        { label: "Payment Setup", verified: paymentVerified, icon: CreditCard, url: "/verification" }
    ];

    return (
        <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Verification Status</h2>
            <div className="space-y-4">
                {verifications.map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <item.icon className={`h-5 w-5 ${item.verified ? 'text-green-500' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <div>
                            {item.verified ? (
                                <span className="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                    Verified
                                </span>
                            ) : (
                                <>
                                    {isOwner ? (
                                        <a
                                            href={item.url}
                                            className="text-xs font-medium text-primary hover:underline"
                                        >
                                            Verify Now
                                        </a>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Not Verified</span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
