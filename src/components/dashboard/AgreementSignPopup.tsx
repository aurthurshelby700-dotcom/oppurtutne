"use client";

import { useState } from "react";
import { X, FileText } from "lucide-react";
import { signAgreementAsClient, signAgreementAsFreelancer } from "@/lib/actions/agreements";

interface AgreementSignPopupProps {
    contestId: string;
    entryId?: string;
    userType: "client" | "freelancer";
    onClose: () => void;
    onSign: () => void;
}

const AGREEMENT_TEXT = `
CONTEST WORK AGREEMENT

This Agreement is entered into between the Contest Holder ("Client") and the Contest Winner ("Freelancer") for the delivery of contest work.

1. COPYRIGHT TRANSFER
Upon full payment, the Freelancer hereby transfers all rights, title, and interest in the submitted work to the Client, including but not limited to copyright, trademark, and any other intellectual property rights.

2. USAGE RIGHTS
The Client shall have the exclusive right to use, modify, reproduce, distribute, and display the work in any medium, for any purpose, without limitation.

3. FREELANCER WARRANTIES
The Freelancer warrants that:
- The work is original and does not infringe on any third-party rights
- The Freelancer has full authority to transfer the rights granted herein
- The work does not contain any unlawful or defamatory content

4. PAYMENT
Payment shall be released upon Client's acceptance of the handover files. The prize amount shall be transferred to the Freelancer's wallet immediately upon acceptance.

5. CONFIDENTIALITY
Both parties agree to keep confidential any proprietary information shared during the contest and handover process.

6. DISPUTE RESOLUTION
Any disputes arising from this agreement shall be resolved through the platform's dispute resolution process.

By signing this agreement, both parties acknowledge that they have read, understood, and agree to be bound by these terms.
`;

export function AgreementSignPopup({ contestId, entryId, userType, onClose, onSign }: AgreementSignPopupProps) {
    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSign = async () => {
        if (!agreed) return;

        setIsSubmitting(true);

        try {
            let result;
            if (userType === "client" && entryId) {
                result = await signAgreementAsClient(contestId, entryId);
            } else {
                result = await signAgreementAsFreelancer(contestId);
            }

            if (result.error) {
                alert(result.error);
            } else {
                onSign();
                onClose();
            }
        } catch (error) {
            console.error("Error signing agreement:", error);
            alert("Failed to sign agreement");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-orange-500" />
                        <h2 className="text-xl font-bold">Contest Work Agreement</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Agreement Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                            {AGREEMENT_TEXT}
                        </pre>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-card space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="h-5 w-5 rounded border-border text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm font-medium">
                            I have read and agree to the terms of this agreement
                        </span>
                    </label>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSign}
                            disabled={!agreed || isSubmitting}
                            className="px-6 py-2.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Signing..." : "Sign Agreement"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
