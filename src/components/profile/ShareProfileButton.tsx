"use client";

export function ShareProfileButton() {
    const handleShare = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            alert('Profile link copied!');
        }
    };

    return (
        <button
            onClick={handleShare}
            className="px-4 py-2 border border-border bg-background hover:bg-accent rounded-md text-sm font-medium"
        >
            Share Profile
        </button>
    );
}
