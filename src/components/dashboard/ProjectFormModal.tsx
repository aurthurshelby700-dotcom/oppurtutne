"use client";

import { useState, useEffect } from "react";
import { X, FolderPlus, ArrowLeft, Layers, Trophy, ArrowRight, Plus } from "lucide-react";
import { ProjectForm } from "@/components/dashboard/ProjectForm";
import { cn } from "@/lib/utils";

interface ProjectFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    projectToEdit?: any;
}

export function ProjectFormModal({ isOpen, onClose, onSuccess, projectToEdit }: ProjectFormModalProps) {
    const [step, setStep] = useState<'selection' | 'form'>(projectToEdit ? 'form' : 'selection');
    const [selectedType, setSelectedType] = useState<"project" | "contest">("project");

    // Reset state when opening/closing
    useEffect(() => {
        if (isOpen && !projectToEdit) {
            setStep('selection');
            setSelectedType("project"); // Default
        } else if (isOpen && projectToEdit) {
            setStep('form');
            setSelectedType(projectToEdit.type || "project");
        }
    }, [isOpen, projectToEdit]);

    if (!isOpen) return null;

    const handleTypeSelect = (type: "project" | "contest") => {
        setSelectedType(type);
        setStep('form');
    };

    const handleBack = () => {
        setStep('selection');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={cn(
                "bg-card w-full rounded-2xl shadow-xl border border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col",
                step === 'selection' ? "max-w-3xl" : "max-w-2xl max-h-[90vh]"
            )}>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30 shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {step === 'form' && !projectToEdit && (
                            <button onClick={handleBack} className="mr-2 hover:bg-muted p-1 rounded-full transition-colors">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        {step === 'selection' ? (
                            <>
                                <Plus className="h-5 w-5 text-primary" />
                                Create New
                            </>
                        ) : (
                            <>
                                {selectedType === 'contest' ? <Trophy className="h-5 w-5 text-amber-500" /> : <FolderPlus className="h-5 w-5 text-primary" />}
                                {projectToEdit ? "Edit " : "Post a New "}{selectedType === 'contest' ? "Contest" : "Project"}
                            </>
                        )}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className={cn("overflow-y-auto", step === 'selection' ? "p-8" : "p-6")}>
                    {step === 'selection' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Project Option */}
                            <div
                                onClick={() => handleTypeSelect('project')}
                                className="border border-border rounded-xl p-6 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group flex flex-col gap-4"
                            >
                                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Layers className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-1">Post a Project</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Hire a freelancer for a specific job or task. Best for clear requirements.
                                    </p>
                                </div>
                                <div className="mt-auto pt-4 flex items-center text-sm font-medium text-primary">
                                    Select Project <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            {/* Contest Option */}
                            <div
                                onClick={() => handleTypeSelect('contest')}
                                className="border border-border rounded-xl p-6 hover:border-amber-500 hover:bg-amber-500/5 cursor-pointer transition-all group flex flex-col gap-4"
                            >
                                <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Trophy className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-1">Start a Contest</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Crowdsource ideas from multiple freelancers. Best for creative designs.
                                    </p>
                                </div>
                                <div className="mt-auto pt-4 flex items-center text-sm font-medium text-amber-600">
                                    Select Contest <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <ProjectForm
                            projectToEdit={projectToEdit}
                            onSuccess={onSuccess}
                            onCancel={onClose}
                            isModal={true}
                            type={selectedType}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
