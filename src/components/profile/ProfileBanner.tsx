"use client";

import { useState } from "react";
import { Camera, Trash2, ImagePlus, MoreHorizontal } from "lucide-react";
import FileUploader from "@/components/ui/FileUploader";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ProfileBannerProps {
    initialUrl: string | null;
    isOwner: boolean;
    username: string;
}

export function ProfileBanner({ initialUrl, isOwner, username }: ProfileBannerProps) {
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
                body: JSON.stringify({ bannerImageUrl: newUrl })
            });

            if (!res.ok) throw new Error("Failed to update banner");

            setUrl(newUrl);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to update banner");
        } finally {
            setLoading(false);
            setIsMenuOpen(false);
        }
    };

    if (!isOwner) {
        return (
            <div className="h-64 w-full bg-gradient-to-br from-purple-500 to-blue-500 overflow-hidden relative">
                {url && (
                    <img
                        src={url}
                        alt="Banner"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>
        );
    }

    return (
        <div
            className="h-64 w-full bg-gradient-to-br from-purple-500 to-blue-500 overflow-hidden relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {url ? (
                <img
                    src={url}
                    alt="Banner"
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/20 text-4xl font-black uppercase tracking-widest">

                    </span>
                </div>
            )}

            {/* Camera Overlay */}
            <div
                className={cn(
                    "absolute top-4 right-4 z-50 transition-opacity duration-200",
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
                        className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                        <Camera className="h-5 w-5" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div
                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-black/5 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()} // Prevent menu close on click
                        >
                            <div className="p-1">
                                <FileUploader
                                    onUploadSuccess={(newUrl) => updateProfile(newUrl)}
                                    folder="opportune/banners"
                                    resourceType="image"
                                    cropping={false}
                                >
                                    <div className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-foreground transition-colors cursor-pointer">
                                        <ImagePlus className="h-4 w-4 text-blue-500" />
                                        {url ? "Change Banner Image" : "Add Banner Image"}
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
                                        Remove Banner Image
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
