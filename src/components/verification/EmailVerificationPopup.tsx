"use client";

import { useState, useEffect } from "react";
import { X, Mail, Loader2, CheckCircle, ShieldCheck, AlertCircle } from "lucide-react";
import { sendEmailOTP, verifyEmailOTP } from "@/lib/actions/verification";

interface EmailVerificationPopupProps {
    userEmail: string;
    onClose: () => void;
    onVerified: () => void;
}

export function EmailVerificationPopup({ userEmail, onClose, onVerified }: EmailVerificationPopupProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [countdown, setCountdown] = useState(300); // 5 minutes
    const [resendCooldown, setResendCooldown] = useState(60); // 60 seconds
    const [canResend, setCanResend] = useState(false);

    // Main timer
    useEffect(() => {
        if (step === 2 && countdown > 0) {
            const timer = setInterval(() => setCountdown(c => c - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [step, countdown]);

    // Resend cooldown timer
    useEffect(() => {
        if (step === 2 && resendCooldown > 0) {
            const timer = setInterval(() => setResendCooldown(c => {
                if (c <= 1) {
                    setCanResend(true);
                    return 0;
                }
                return c - 1;
            }), 1000);
            return () => clearInterval(timer);
        }
    }, [step, resendCooldown]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const handleSendOTP = async () => {
        setIsLoading(true);
        setError("");
        const res = await sendEmailOTP();
        if (res.success) {
            setStep(2);
            setCountdown(300);
            setResendCooldown(60);
            setCanResend(false);
        } else {
            setError(res.error || "Failed to send code");
        }
        setIsLoading(false);
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) return;
        setIsLoading(true);
        setError("");
        const res = await verifyEmailOTP(otp);
        if (res.success) {
            onVerified();
            onClose();
        } else {
            setError(res.error || "Verification failed");
        }
        setIsLoading(false);
    };

    const handleResend = async () => {
        if (!canResend) return;
        setIsLoading(true);
        setError("");
        const res = await sendEmailOTP();
        if (res.success) {
            setCountdown(300);
            setResendCooldown(60);
            setCanResend(false);
            setOtp("");
        } else {
            setError(res.error || "Failed to resend code");
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-lg mx-4 rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-muted/50 px-8 py-6 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-500 p-2 rounded-lg">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight">Verify Your Email</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                        disabled={isLoading}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-8">
                    {step === 1 ? (
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <p className="text-muted-foreground leading-relaxed">
                                    We will send a 6-digit one-time code to your registered email address to verify your professional identity.
                                </p>
                            </div>

                            <div className="p-6 bg-muted/30 border border-border rounded-2xl">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Registered Email</label>
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-orange-500" />
                                    <span className="font-bold text-lg">{userEmail}</span>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                onClick={handleSendOTP}
                                disabled={isLoading}
                                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    "Send OTP"
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="text-center space-y-2">
                                <p className="text-muted-foreground">Enter the 6-digit code sent to</p>
                                <p className="font-black text-foreground">{userEmail}</p>
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000 000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full text-center text-5xl font-black tracking-[12px] py-8 rounded-2xl border-2 border-border bg-muted/20 focus:border-orange-500 focus:outline-none transition-all placeholder:text-muted/30"
                                    autoFocus
                                />
                                <div className="flex justify-between items-center px-2">
                                    <div className={`text-sm font-bold flex items-center gap-1.5 ${countdown < 60 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                        <Loader2 className={`h-4 w-4 ${countdown > 0 ? 'animate-spin' : ''}`} />
                                        <span>Expires in {formatTime(countdown)}</span>
                                    </div>
                                    {countdown === 0 && (
                                        <span className="text-sm font-bold text-red-500">Code Expired</span>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button
                                    onClick={handleResend}
                                    disabled={!canResend || isLoading}
                                    className="py-4 border border-border rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-muted disabled:opacity-50 transition-all"
                                >
                                    {canResend ? "Resend OTP" : `Resend in ${resendCooldown}s`}
                                </button>
                                <button
                                    onClick={handleVerifyOTP}
                                    disabled={isLoading || otp.length !== 6 || countdown === 0}
                                    className="py-4 bg-orange-500 text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-orange-600 disabled:opacity-50 transition-all shadow-xl shadow-orange-500/10 active:scale-[0.98]"
                                >
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Verify"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
