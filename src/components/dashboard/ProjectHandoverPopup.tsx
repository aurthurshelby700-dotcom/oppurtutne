"use client";

import { useState, useEffect } from "react";
import { X, Upload, File, Loader2, Download, Trash2, FileCheck } from "lucide-react";
import { submitProjectHandover } from "@/lib/actions/projectHandovers";
import FileUploader from "@/components/ui/FileUploader";
import { cn } from "@/lib/utils";

interface ProjectHandoverPopupProps {
    projectId: string;
    initialHandover?: any;
    onClose: () => void;
    onSubmit: () => void;
}

export function ProjectHandoverPopup({ projectId, initialHandover, onClose, onSubmit }: ProjectHandoverPopupProps) {
    const [files, setFiles] = useState<Array<{ fileUrl: string; fileName: string; isNew?: boolean }>>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialHandover?.files) {
            setFiles(initialHandover.files.map((f: any) => ({
                fileUrl: f.fileUrl,
                fileName: f.fileUrl.split('/').pop() || "Handover File",
                isNew: false
            })));
        }
    }, [initialHandover]);

    const handleFileUpload = (url: string, result: any) => {
        const fileName = result.original_filename || "Uploaded File";
        setFiles(prev => [...prev, { fileUrl: url, fileName, isNew: true }]);
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (files.length === 0) {
            alert("Please upload at least one file");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await submitProjectHandover(projectId, files.map(f => ({ fileUrl: f.fileUrl })));

            if (result.error) {
                alert(result.error);
            } else {
                onSubmit();
                onClose();
            }
        } catch (error) {
            console.error("Error submitting project handover:", error);
            alert("Failed to submit handover");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden scale-in-center transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Upload className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Project Handover</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Prepare and submit final work for client review</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors group"
                    >
                        <X className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* File Uploader Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Add Files</h3>
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded">Max 50MB per file</span>
                        </div>
                        <FileUploader
                            onUploadSuccess={handleFileUpload}
                            allowedFormats={undefined}
                            label="Drag and drop or click to add files"
                        />
                    </div>

                    {/* Files Display Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                                Uploaded Inventory ({files.length})
                            </h3>
                        </div>

                        {files.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "group relative bg-card border rounded-xl p-4 transition-all duration-200 hover:shadow-lg",
                                            file.isNew ? "border-purple-500/20 bg-purple-500/[0.02]" : "border-border"
                                        )}
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-start justify-between">
                                                <div className={cn(
                                                    "p-3 rounded-xl",
                                                    file.isNew ? "bg-purple-500/10 text-purple-500" : "bg-muted text-muted-foreground"
                                                )}>
                                                    <File className="h-8 w-8" />
                                                </div>
                                                <div className="flex gap-1">
                                                    <a
                                                        href={file.fileUrl}
                                                        download
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                                        title="Download File"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                    <button
                                                        onClick={() => handleRemoveFile(index)}
                                                        className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors text-muted-foreground hover:text-rose-500"
                                                        title="Remove File"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold truncate pr-2" title={file.fileName}>
                                                    {file.fileName}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                        {file.fileName.split('.').pop() || 'FILE'}
                                                    </span>
                                                    {file.isNew && (
                                                        <span className="text-[8px] font-black uppercase tracking-tighter text-purple-500 flex items-center gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
                                                            New
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-muted/20 opacity-50">
                                <File className="h-12 w-12 mb-3 text-muted-foreground" />
                                <p className="text-sm font-medium">No files added yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground max-w-sm">
                        Submission will notify the client for review. Payment is released only upon their acceptance.
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-border hover:bg-muted transition-all font-bold text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={files.length === 0 || isSubmitting}
                            className="px-8 py-2.5 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Submitting Handover...
                                </>
                            ) : (
                                <>
                                    Submit Handover
                                    <FileCheck className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
