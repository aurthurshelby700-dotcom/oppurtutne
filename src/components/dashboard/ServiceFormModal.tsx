"use client";

import { X, Layers } from "lucide-react";
import { ServiceForm } from "@/components/dashboard/ServiceForm";

interface ServiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    serviceToEdit?: any; // Optional service object for editing
}

export function ServiceFormModal({ isOpen, onClose, onSuccess, serviceToEdit }: ServiceFormModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        {serviceToEdit ? "Edit Service" : "Create New Service"}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[85vh] overflow-y-auto">
                    <div className="p-6">
                        <ServiceForm
                            serviceToEdit={serviceToEdit}
                            onSuccess={onSuccess}
                            isModal={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
