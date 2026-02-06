"use client";

import { useState } from "react";
import { Plus, Loader2, X, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Reusing custom UI components pattern
const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2">
        {children}
    </label>
);

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
        )}
        {...props}
    />
);

export function AddPortfolioModal({ user, onUpdate }: { user: any, onUpdate?: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: "",
        category: "",
        imageUrl: "",
        link: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Append to existing portfolio
            const currentPortfolio = user.portfolio || [];
            const newPortfolio = [...currentPortfolio, formData];

            const res = await fetch(`/api/users/${user.username}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    portfolio: newPortfolio
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to add project");
            }

            setOpen(false);
            setFormData({ title: "", category: "", imageUrl: "", link: "" }); // Reset
            router.refresh();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            alert("Failed to add project");
        } finally {
            setLoading(false);
        }
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition-colors border border-primary/20"
            >
                <Plus className="h-4 w-4" /> Add Project
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background rounded-xl border border-border shadow-lg max-w-md w-full overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-lg font-semibold">Add Portfolio Project</h2>
                    <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-muted transition-colors">
                        <X className="h-5 w-5 opacity-70" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid gap-2">
                        <Label>Project Image URL</Label>
                        <div className="relative">
                            <Input
                                name="imageUrl"
                                placeholder="https://..."
                                value={formData.imageUrl}
                                onChange={handleChange}
                                required
                                className="pl-10"
                            />
                            <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground">URL of the project image (Unsplash, etc.)</p>
                    </div>

                    <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Fintech Dashboard"
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Category</Label>
                        <Input
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            placeholder="e.g. UI/UX Design"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>External Link (Optional)</Label>
                        <Input
                            name="link"
                            value={formData.link}
                            onChange={handleChange}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Add Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
