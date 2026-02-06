"use client";

import { CldUploadWidget } from 'next-cloudinary';
import { useCallback, useRef } from 'react';
import { UploadCloud, File, Image as ImageIcon, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
    onUploadSuccess: (url: string, result: any) => void;
    resourceType?: "image" | "video" | "raw" | "auto";
    label?: string;
    className?: string;
    showPreview?: boolean;
    cropping?: boolean;
    croppingAspectRatio?: number;
    showSkipCropButton?: boolean;
    allowedFormats?: string[];
    folder?: string;
}

export default function FileUploader({
    onUploadSuccess,
    resourceType = "auto",
    label = "Upload File",
    className,
    children,
    cropping,
    croppingAspectRatio,
    showSkipCropButton,
    allowedFormats,
    folder
}: FileUploaderProps & { children?: React.ReactNode }) {

    const tempResultRef = useRef<any>(null);

    const handleSuccess = useCallback((result: any) => {
        if (result.event === "success" && result.info && typeof result.info !== 'string') {
            // Store result but wait for close to trigger callback
            tempResultRef.current = result;
        }
    }, []);

    const handleClose = useCallback(() => {
        if (tempResultRef.current) {
            const result = tempResultRef.current;
            onUploadSuccess(result.info.secure_url, result.info);
            tempResultRef.current = null; // Reset
        }
    }, [onUploadSuccess]);

    const isImageResourceType = resourceType === 'image' || resourceType === 'auto';

    return (
        <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
            options={{
                sources: ['local'],
                resourceType: resourceType,
                multiple: false,
                clientAllowedFormats: allowedFormats || ["png", "jpeg", "jpg"],
                maxFileSize: 10000000, // 10MB
                cropping: cropping ?? isImageResourceType,
                croppingAspectRatio: croppingAspectRatio ?? (isImageResourceType ? 1 : undefined),
                showSkipCropButton: showSkipCropButton ?? false,
                folder: folder,
            }}
            onSuccess={handleSuccess}
            onClose={handleClose}
        >
            {({ open }) => {
                if (children) {
                    return (
                        <div onClick={() => open()} className="cursor-pointer">
                            {children}
                        </div>
                    );
                }
                return (
                    <button
                        onClick={() => open()}
                        className={cn(
                            "flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-card hover:bg-secondary/50 transition-colors w-full cursor-pointer group",
                            className
                        )}
                    >
                        <div className="bg-primary/10 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <UploadCloud className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-foreground/80">{label}</span>
                        <span className="text-xs text-muted-foreground mt-1">
                            Supports Images, Videos, PDFs
                        </span>
                    </button>
                );
            }}
        </CldUploadWidget>
    );
}
