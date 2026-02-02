"use client";

import { UserCircle, MapPin, Edit, CheckCircle, Smartphone, Mail, CreditCard, ShieldCheck, Star, Camera, Link as LinkIcon, ImageIcon, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { fetchUserProfile, updateUserProfile } from "@/lib/actions/user";
import { UserProfile } from "@/types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import FileUploader from "@/components/ui/FileUploader";

// Mock Data for fields not yet in DB
const MOCK_EXTENDED_DATA = {
    username: "@alex_creator",
    verification: {
        identity: true,
        email: true,
        phone: true,
        payment: false // Demonstrate verified vs not verified
    },
    reviews: [
        { id: 1, client: "Acme Corp", rating: 5, text: "Alex delivered exceptional work on our branding project. Highly recommended!", date: "2 days ago" },
        { id: 2, client: "StartUp Inc", rating: 4.8, text: "Great communication and very skilled designer.", date: "1 week ago" }
    ],
    education: [
        { id: 1, degree: "BFA in Graphic Design", school: "Rhode Island School of Design", year: "2018-2022" },
        { id: 2, degree: "UX Certification", school: "Google Career Certificates", year: "2023" }
    ],
    portfolio: [
        { id: 1, title: "Fintech Dashboard", category: "UI/UX", image: "bg-blue-500/10" },
        { id: 2, title: "Eco Brand Identity", category: "Branding", image: "bg-green-500/10" },
        { id: 3, title: "Travel App Prototype", category: "Mobile", image: "bg-orange-500/10" },
        { id: 4, title: "SaaS Marketing Site", category: "Web Design", image: "bg-purple-500/10" }
    ]
};

// Helper for verification icons
const VerificationIcon = ({
    type,
    isVerified,
    icon: Icon,
    label
}: {
    type: string;
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
            {!isVerified && (
                <Link href="/verify" className="text-xs text-primary hover:underline block mt-1">
                    Verify Now
                </Link>
            )}
        </TooltipContent>
    </Tooltip>
);

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<"Profile" | "Portfolio" | "Reviews">("Profile");
    const [profileView, setProfileView] = useState<"About" | "Skills" | "Education">("About");

    // Sub-tab removed as Reviews is now top-level and Education sits in Profile

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showImageOptions, setShowImageOptions] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Edit state
    const [editForm, setEditForm] = useState({
        name: "",
        title: "",
        bio: "",
        location: "",
        skillsRaw: ""
    });

    const loadProfile = useCallback(async () => {
        try {
            const data = await fetchUserProfile();
            if (data && !data.error) {
                setProfile(data as unknown as UserProfile);
                setEditForm({
                    name: data.name || "",
                    title: data.title || "",
                    bio: data.bio || "",
                    location: data.location || "",
                    skillsRaw: data.skills?.join(", ") || ""
                });
            } else {
                setError(data?.error || "Failed to load profile");
            }
        } catch (err) {
            setError("An unexpected error occurred");
            console.error(err);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleAvatarUpload = useCallback(async (url: string) => {
        // Optimistic update
        setProfile(prev => prev ? { ...prev, avatar_url: url } : null);

        await updateUserProfile({ avatar_url: url });
        setShowImageOptions(false);

        // Re-fetch to ensure sync
        await loadProfile();
    }, [loadProfile]);

    const handleCoverUpload = useCallback(async (url: string) => {
        // Optimistic update
        setProfile(prev => prev ? { ...prev, cover_url: url } : null);

        await updateUserProfile({ cover_url: url });

        // Re-fetch to ensure sync
        await loadProfile();
    }, [loadProfile]);

    const handleRemoveAvatar = useCallback(async () => {
        // Optimistic update
        setProfile(prev => prev ? { ...prev, avatar_url: undefined } : null);

        await updateUserProfile({ avatar_url: undefined });

        // Re-fetch to ensure sync
        await loadProfile();
    }, [loadProfile]);

    const handleRemoveCover = useCallback(async () => {
        // Optimistic update
        setProfile(prev => prev ? { ...prev, cover_url: undefined } : null);

        await updateUserProfile({ cover_url: undefined });

        // Re-fetch to ensure sync
        await loadProfile();
    }, [loadProfile]);

    const handleSave = async () => {
        const skills = editForm.skillsRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
        await updateUserProfile({
            name: editForm.name,
            title: editForm.title,
            bio: editForm.bio,
            location: editForm.location,
            skills
        });

        // Optimistic update
        setProfile(prev => prev ? ({ ...prev, ...editForm, skills }) : null);
        setIsEditing(false);
    };

    if (error) {
        return (
            <div className="p-8 text-center space-y-4">
                <div className="text-destructive font-medium">Error: {error}</div>
                <p className="text-muted-foreground">Please try logging in again.</p>
            </div>
        );
    }

    if (!profile) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading profile...</div>;

    const coverImage = profile.cover_url || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop';

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background pb-20">

                {/* 1. HEADER SECTION (Full Width, 21:3) */}
                <div className="relative w-full group/cover bg-neutral-900">

                    {/* Cover Image Container - 21:3 Aspect Ratio */}
                    <div className="relative w-full aspect-[21/3] max-h-[500px] overflow-hidden">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                            style={{ backgroundImage: `url(${coverImage})` }}
                        ></div>
                        <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-black/80 to-transparent"></div>



                        {/* Edit Profile Button (Top Right) */}
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="absolute top-6 right-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-lg shadow-lg transition-colors flex items-center gap-2 z-20"
                            >
                                <Edit className="h-4 w-4" /> Edit Profile
                            </button>
                        )}
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

                            {/* Avatar Actions - Icon Group */}
                            <div className="absolute bottom-1 right-1 z-20 group/avatar-btn">
                                <div className="p-1.5 bg-purple-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-purple-700 transition-colors">
                                    <Camera className="h-3.5 w-3.5" />
                                </div>

                                {/* Avatar Menu - Shows on Hover of Icon */}
                                <div className="absolute top-full left-0 mt-2 w-48 bg-popover border border-border rounded-md shadow-md z-30 overflow-hidden opacity-0 invisible group-hover/avatar-btn:opacity-100 group-hover/avatar-btn:visible transition-all duration-200">
                                    <FileUploader
                                        onUploadSuccess={handleAvatarUpload}
                                        resourceType="image"
                                        label="Change Image"
                                        cropping={true}
                                        croppingAspectRatio={1}
                                        className="!p-0 !border-0 !bg-transparent w-full"
                                    >
                                        <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4" /> Change Image
                                        </button>
                                    </FileUploader>

                                    <button
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2"
                                        onClick={() => handleRemoveAvatar()}
                                    >
                                        <Trash2 className="h-4 w-4" /> Remove Image
                                    </button>

                                    <div className="h-px bg-border my-1" />

                                    {/* Cover Options */}
                                    <FileUploader
                                        onUploadSuccess={handleCoverUpload}
                                        resourceType="image"
                                        label="Change Cover"
                                        cropping={true}
                                        croppingAspectRatio={16 / 9}
                                        className="!p-0 !border-0 !bg-transparent w-full"
                                    >
                                        <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4" /> Change Cover
                                        </button>
                                    </FileUploader>

                                    <button
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2"
                                        onClick={() => handleRemoveCover()}
                                    >
                                        <Trash2 className="h-4 w-4" /> Remove Cover
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Text Details Area */}
                        <div className="flex-1 text-white pb-6">
                            {isEditing ? (
                                <div className="bg-black/80 backdrop-blur rounded p-4 border border-white/10 max-w-2xl">
                                    <div className="grid grid-cols-2 gap-4 mb-2">
                                        <input
                                            className="w-full p-2 border border-white/20 rounded bg-white/10 text-white placeholder:text-white/40"
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            placeholder="Full Name"
                                        />
                                        <input
                                            className="w-full p-2 border border-white/20 rounded bg-white/10 text-white placeholder:text-white/40"
                                            value={editForm.title}
                                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                            placeholder="Title"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-sm text-white/70">Cancel</button>
                                        <button onClick={handleSave} className="px-3 py-1 bg-purple-600 rounded text-sm text-white">Save</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col justify-end h-full">
                                    {/* Row 1: Name (Centered roughly to Avatar) */}
                                    <h1 className="text-4xl font-bold tracking-tight shadow-sm mb-1">
                                        {profile.name || <span className="opacity-50 italic font-normal text-3xl">Add Full Name</span>}
                                    </h1>

                                    {/* Row 2: Username | Title | Location */}
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base md:text-lg text-white/90 font-medium">
                                        <span className="opacity-80">{MOCK_EXTENDED_DATA.username}</span>
                                        <span className="opacity-40 hidden sm:inline">•</span>
                                        <span className="text-purple-300">
                                            {profile.title || <span className="opacity-50 italic text-sm">Add Title</span>}
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
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. TAB SWITCHER (Attached to bottom of Header) */}
                <div className="sticky top-0 z-40 bg-background border-b border-border shadow-sm">
                    <div className="flex w-full">
                        <button
                            onClick={() => setActiveTab("Profile")}
                            className={cn(
                                "flex-1 py-4 text-sm md:text-base font-semibold border-b-2 transition-all text-center hover:bg-muted/50",
                                activeTab === "Profile"
                                    ? "border-purple-600 text-purple-600"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab("Portfolio")}
                            className={cn(
                                "flex-1 py-4 text-sm md:text-base font-semibold border-b-2 transition-all text-center hover:bg-muted/50",
                                activeTab === "Portfolio"
                                    ? "border-purple-600 text-purple-600"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Portfolio
                        </button>
                        <button
                            onClick={() => setActiveTab("Reviews")}
                            className={cn(
                                "flex-1 py-4 text-sm md:text-base font-semibold border-b-2 transition-all text-center hover:bg-muted/50",
                                activeTab === "Reviews"
                                    ? "border-purple-600 text-purple-600"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Reviews ({MOCK_EXTENDED_DATA.reviews.length})
                        </button>
                    </div>
                </div>

                {/* 3. MAIN CONTENT AREA */}
                <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* PROFILE TAB */}
                    {activeTab === "Profile" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                            {/* Left Col: About | Skills | Education (Scrollable Box) */}
                            <div className="md:col-span-2">
                                <div className="bg-card border border-border rounded-xl shadow-sm h-[400px] overflow-y-auto flex flex-col">
                                    {/* Sticky Tab Switcher */}
                                    <div className="sticky top-0 z-10 bg-card p-6 pb-0 border-b border-border">
                                        <div className="flex gap-6 mb-4">
                                            <button
                                                onClick={() => setProfileView("About")}
                                                className={cn(
                                                    "pb-2 text-sm font-semibold transition-all relative top-[1px] border-b-2 hover:text-foreground",
                                                    profileView === "About" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
                                                )}
                                            >
                                                About Me
                                            </button>
                                            <button
                                                onClick={() => setProfileView("Skills")}
                                                className={cn(
                                                    "pb-2 text-sm font-semibold transition-all relative top-[1px] border-b-2 hover:text-foreground",
                                                    profileView === "Skills" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
                                                )}
                                            >
                                                Skills
                                            </button>
                                            <button
                                                onClick={() => setProfileView("Education")}
                                                className={cn(
                                                    "pb-2 text-sm font-semibold transition-all relative top-[1px] border-b-2 hover:text-foreground",
                                                    profileView === "Education" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
                                                )}
                                            >
                                                Education
                                            </button>
                                        </div>
                                    </div>

                                    {/* Scrollable Content Area */}
                                    <div className="p-6 pt-6">
                                        {profileView === "About" && (
                                            <div className="animate-in fade-in slide-in-from-left-2 duration-300 space-y-4">
                                                <div>
                                                    {profile.title && <p className="text-purple-600 font-medium text-lg">{profile.title}</p>}
                                                </div>

                                                {isEditing ? (
                                                    <textarea
                                                        className="w-full p-4 border rounded-lg bg-background min-h-[150px] leading-relaxed"
                                                        value={editForm.bio}
                                                        onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                                        placeholder="Write a bio..."
                                                    />
                                                ) : (
                                                    <p className="text-foreground/80 leading-relaxed text-lg">
                                                        {profile.bio || <span className="italic opacity-50 text-base">No bio added yet. Tell people about yourself.</span>}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {profileView === "Skills" && (
                                            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
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
                                                {isEditing && (
                                                    <div className="mt-4">
                                                        <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Edit Skills (comma separated)</label>
                                                        <input
                                                            className="w-full p-2 border rounded bg-background text-sm"
                                                            value={editForm.skillsRaw}
                                                            onChange={e => setEditForm({ ...editForm, skillsRaw: e.target.value })}
                                                            placeholder="React, Next.js, Design..."
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {profileView === "Education" && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                                {MOCK_EXTENDED_DATA.education.map(edu => (
                                                    <div key={edu.id} className="flex gap-5 p-6 rounded-xl bg-secondary/10 border border-border hover:border-purple-500/20 transition-colors">
                                                        <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 shrink-0">
                                                            <CheckCircle className="h-6 w-6" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="font-bold text-foreground text-lg">{edu.school}</h4>
                                                                <span className="text-xs font-medium bg-secondary px-2 py-1 rounded text-secondary-foreground">{edu.year}</span>
                                                            </div>
                                                            <p className="text-foreground/80 font-medium">{edu.degree}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Verification Box */}
                            <div className="md:col-span-1">
                                <div className="bg-card border border-border rounded-xl p-5 shadow-sm sticky top-24 min-h-[400px]">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Verifications</h3>

                                    {/* Icons Row: Grid 4 cols to fill width */}
                                    <div className="grid grid-cols-4 gap-3 pb-4 border-b border-border">
                                        <VerificationIcon type="identity" icon={ShieldCheck} isVerified={MOCK_EXTENDED_DATA.verification.identity} label="Identity" />
                                        <VerificationIcon type="email" icon={Mail} isVerified={MOCK_EXTENDED_DATA.verification.email} label="Email" />
                                        <VerificationIcon type="phone" icon={Smartphone} isVerified={MOCK_EXTENDED_DATA.verification.phone} label="Phone" />
                                        <VerificationIcon type="payment" icon={CreditCard} isVerified={MOCK_EXTENDED_DATA.verification.payment} label="Payment" />
                                    </div>

                                    {/* Empty Space Below (Placeholder) */}
                                    <div className="pt-4 text-center">
                                        <p className="text-xs text-muted-foreground/30 italic">Additional details will appear here</p>
                                    </div>

                                    <div className="mt-auto pt-4 text-center">
                                        <span className="text-xs text-muted-foreground block mt-8">Joined September 2023</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PORTFOLIO TAB */}
                    {activeTab === "Portfolio" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in">
                            {MOCK_EXTENDED_DATA.portfolio.map(item => (
                                <div key={item.id} className="group cursor-pointer rounded-xl border border-border bg-card overflow-hidden hover:shadow-xl transition-all duration-300">
                                    <div className={`aspect-video w-full ${item.image} flex items-center justify-center group-hover:scale-105 transition-transform duration-500 relative`}>
                                        <span className="text-muted-foreground/30 font-bold text-4xl">IMG</span>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-col gap-2 text-white">
                                            <p className="font-bold">View Project</p>
                                            <span className="text-xs opacity-75 uppercase tracking-wider">{item.category}</span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-foreground group-hover:text-purple-600 transition-colors truncate">{item.title}</h3>
                                            <LinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-purple-600" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* REVIEWS TAB */}
                    {activeTab === "Reviews" && (
                        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
                            {MOCK_EXTENDED_DATA.reviews.map(review => (
                                <div key={review.id} className="p-6 rounded-xl bg-card border border-border hover:shadow-sm transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold text-foreground">{review.client}</h4>
                                            <div className="flex text-amber-500 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={cn("h-4 w-4 fill-current", i >= Math.floor(review.rating) && "opacity-30")} />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground">{review.date}</span>
                                    </div>
                                    <p className="text-foreground/80 leading-relaxed border-l-4 border-purple-200 pl-4">{review.text}</p>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </TooltipProvider >
    );
}
