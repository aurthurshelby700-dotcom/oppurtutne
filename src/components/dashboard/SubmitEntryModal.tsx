"use client";

import { useState, useRef } from "react";
import { X, Upload, AlertCircle, FileCheck, ShieldCheck, Film, FileText, Image as ImageIcon, Loader2, Trash2, Layers } from "lucide-react";
import { submitEntry } from "@/lib/actions/entries";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { IMAGE_FORMATS, VIDEO_FORMATS, DOCUMENT_FORMATS } from "@/lib/constants";

interface SubmitEntryModalProps {
    contest: any;
    user: any;
    onClose: () => void;
    onSuccess: () => void;
}

interface LocalFile {
    file: File;
    preview: string;
    format: string; // extension
    id: string;
}

export function SubmitEntryModal({ contest, user, onClose, onSuccess }: SubmitEntryModalProps) {
    const [files, setFiles] = useState<LocalFile[]>([]);
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEmailVerified = user?.verification?.email || user?.emailVerified;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        const allowedFormats = contest.deliverableFormats || [];
        const newFiles: LocalFile[] = [];

        selectedFiles.forEach(file => {
            const extension = file.name.split('.').pop()?.toLowerCase() || "";

            if (allowedFormats.includes(extension)) {
                newFiles.push({
                    file,
                    preview: IMAGE_FORMATS.includes(extension) ? URL.createObjectURL(file) : "",
                    format: extension,
                    id: Math.random().toString(36).substring(7)
                });
            } else {
                setError(`File extension .${extension} is not allowed for this contest.`);
            }
        });

        setFiles(prev => [...prev, ...newFiles]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeFile = (id: string) => {
        setFiles(prev => {
            const fileToRemove = prev.find(f => f.id === id);
            if (fileToRemove?.preview) URL.revokeObjectURL(fileToRemove.preview);
            return prev.filter(f => f.id !== id);
        });
    };

    const uploadFileToCloudinary = async (localFile: LocalFile) => {
        const formData = new FormData();
        formData.append('file', localFile.file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'images');

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Upload failed');
        }

        return await response.json();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEmailVerified) return;
        if (files.length === 0) {
            setError("Please upload at least one file");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            // 1. Upload all files to Cloudinary
            const uploadPromises = files.map(f => uploadFileToCloudinary(f));
            const uploadResults = await Promise.all(uploadPromises);

            const uploadedFiles = uploadResults.map((result, index) => ({
                fileUrl: result.secure_url,
                format: files[index].format,
            }));

            // 2. Submit to DB
            const result = await submitEntry({
                contestId: contest._id,
                files: uploadedFiles,
                description: description.trim(),
            });

            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.error || "Failed to submit entry");
            }
        } catch (err: any) {
            console.error("Submission error:", err);
            setError(err.message || "An unexpected error occurred during upload");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold">Submit Contest Entry</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {!isEmailVerified ? (
                    <div className="p-12 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-10 w-10 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold">Verify your email to submit an entry</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            Ensure your email is verified to participate in this contest and others.
                        </p>
                        <div className="pt-4 flex items-center justify-center gap-3">
                            <button
                                className="px-6 py-2.5 bg-muted text-muted-foreground rounded-xl font-bold hover:bg-muted/80 transition-all"
                                onClick={onClose}
                            >
                                Got it
                            </button>
                            <Link
                                href="/verification"
                                className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                                onClick={onClose}
                            >
                                Verify Now
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm font-medium border border-destructive/20">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Format Info */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-foreground">Allowed formats for this contest</label>
                                <div className="flex flex-wrap gap-2">
                                    {(contest.deliverableFormats || []).map((f: string) => (
                                        <span key={f} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest border border-white/5 shadow-sm">
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* File Upload Area */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-foreground">Upload Files</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    multiple
                                    accept={(contest.deliverableFormats || []).map((f: string) => `.${f}`).join(',')}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all group"
                                >
                                    <div className="p-3 bg-primary/10 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                                        <Upload className="h-6 w-6 text-primary" />
                                    </div>
                                    <p className="font-bold">Click to Upload Files</p>
                                    <p className="text-xs text-muted-foreground mt-1">Select one or multiple files</p>
                                </button>
                            </div>

                            {/* File Preview Grid */}
                            {files.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {files.map((f) => (
                                        <div key={f.id} className="relative group bg-muted/20 border border-border rounded-xl overflow-hidden aspect-square flex flex-col items-center justify-center p-2">
                                            {IMAGE_FORMATS.includes(f.format) ? (
                                                <img src={f.preview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                            ) : VIDEO_FORMATS.includes(f.format) ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                                                        <Film className="h-6 w-6" />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Video</span>
                                                </div>
                                            ) : DOCUMENT_FORMATS.includes(f.format) ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="p-3 bg-orange-500/10 rounded-full text-orange-500">
                                                        <FileText className="h-6 w-6" />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Document</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="p-3 bg-purple-500/10 rounded-full text-purple-500">
                                                        <Layers className="h-6 w-6" />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500">Source</span>
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(f.id)}
                                                    className="p-2 bg-white text-destructive rounded-full hover:scale-110 transition-transform shadow-lg"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/60 backdrop-blur-sm">
                                                <p className="text-[8px] text-white truncate font-medium">{f.file.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-foreground">Description (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Explain your approach or provide context for your entry..."
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all min-h-[100px] text-sm leading-relaxed"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || files.length === 0}
                                className="px-8 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-lg flex items-center gap-2 min-w-[140px] justify-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        Submit Entry
                                        <FileCheck className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

