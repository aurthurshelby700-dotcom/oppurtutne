"use client";

import { useState } from "react";
import { Camera, Trash2, ImagePlus } from "lucide-react";
import FileUploader from "@/components/ui/FileUploader";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ProfileAvatarProps {
    initialUrl: string | null;
    isOwner: boolean;
    username: string;
    firstName?: string;
}

export function ProfileAvatar({ initialUrl, isOwner, username, firstName }: ProfileAvatarProps) {
    const [url, setUrl] = useState(initialUrl);
    const [isHovered, setIsHovered] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const updateProfile = async (newUrl: string | null) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/users/${username}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileImageUrl: newUrl })
            });

            if (!res.ok) throw new Error("Failed to update profile picture");

            setUrl(newUrl);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to update profile picture");
        } finally {
            setLoading(false);
            setIsMenuOpen(false);
        }
    };

    const initials = firstName ? firstName[0].toUpperCase() : username[0].toUpperCase();

    const AvatarDisplay = () => (
        <div className="h-40 w-40 rounded-full border-4 border-background bg-muted overflow-hidden relative">
            {url ? (
                <img
                    src={url}
                    alt={username}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-blue-400">
                    <span className="text-6xl font-bold text-white">
                        {initials}
                    </span>
                </div>
            )}
        </div>
    );

    if (!isOwner) {
        return <AvatarDisplay />;
    }

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AvatarDisplay />

            {/* Camera Overlay */}
            <div
                className={cn(
                    "absolute bottom-2 right-2 z-50 transition-opacity duration-200",
                    isHovered || isMenuOpen ? "opacity-100" : "opacity-0"
                )}
            >
                {isMenuOpen && (
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsMenuOpen(false)}
                    />
                )}
                <div className="relative z-50">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="bg-black/50 hover:bg-black/70 text-white p-2.5 rounded-full backdrop-blur-sm transition-colors shadow-lg"
                    >
                        <Camera className="h-5 w-5" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-black/5 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()} // Prevent menu close on click
                        >
                            <div className="p-1">
                                <FileUploader
                                    onUploadSuccess={(newUrl) => updateProfile(newUrl)}
                                    resourceType="image"
                                    folder="opportune/profiles"
                                    cropping={true}
                                    croppingAspectRatio={1}
                                >
                                    <div className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-foreground transition-colors cursor-pointer">
                                        <ImagePlus className="h-4 w-4 text-blue-500" />
                                        {url ? "Change Picture" : "Add Picture"}
                                    </div>
                                </FileUploader>

                                {url && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateProfile(null);
                                        }}
                                        className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Remove Picture
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
