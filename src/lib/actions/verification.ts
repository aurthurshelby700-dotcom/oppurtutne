"use server";

import connectToDatabase from "@/lib/db";
import EmailOTP from "@/models/EmailOTP";
import User from "@/models/User";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

// Lazy-loaded Resend to prevent module evaluation issues
async function getResend() {
    try {
        const { Resend } = await import("resend");
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error("RESEND_API_KEY is missing");
            return null;
        }
        return new Resend(apiKey);
    } catch (e) {
        console.error("Failed to load Resend:", e);
        return null;
    }
}

// Generate a 6-digit numeric OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * STEP 1: Send OTP to user's email
 */
export async function sendEmailOTP() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        await connectToDatabase();

        const user = await User.findById(session.user.id);
        if (!user) return { success: false, error: "User not found" };

        if (user.verification?.email) {
            return { success: false, error: "Email already verified" };
        }

        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // One active OTP per user - clear old ones
        await EmailOTP.deleteMany({ userId: user._id });

        // Save new OTP (hashed)
        await EmailOTP.create({
            userId: user._id,
            otpHash,
            expiresAt
        });

        // Send Email
        const resend = await getResend();
        if (!resend) {
            return {
                success: false,
                error: "Email service unconfigured. Please contact support.",
                debug: "Missing RESEND_API_KEY"
            };
        }

        const fromEmail = process.env.RESEND_FROM_EMAIL || "Opportune <onboarding@resend.dev>";

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: user.email,
            subject: "Verify Your Email - Opportune",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                    <h2 style="color: #f97316; margin-bottom: 16px;">Verify Your Email</h2>
                    <p style="color: #374151; margin-bottom: 24px;">We received a request to verify your email for your Opportune account. Use the code below to complete the process:</p>
                    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111827;">${otp}</span>
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">This code will expire in 5 minutes. If you didn't request this, you can safely ignore this email.</p>
                    <div style="margin-top: 32px; border-top: 1px solid #e5e7eb; pt: 16px;">
                        <p style="color: #9ca3af; font-size: 12px;">Opportune | The Future of Work</p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error("Resend Error:", error);
            return { success: false, error: "Failed to send email. Please try again later." };
        }

        return { success: true };
    } catch (err) {
        console.error("sendEmailOTP failure:", err);
        return { success: false, error: "A server error occurred." };
    }
}

/**
 * STEP 2: Verify OTP
 */
export async function verifyEmailOTP(otp: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        await connectToDatabase();

        const user = await User.findById(session.user.id);
        if (!user) return { success: false, error: "User not found" };

        const otpRecord = await EmailOTP.findOne({ userId: user._id });
        if (!otpRecord) {
            return { success: false, error: "No active verification code found." };
        }

        if (new Date() > otpRecord.expiresAt) {
            await EmailOTP.deleteOne({ _id: otpRecord._id });
            return { success: false, error: "Code expired. Please resend OTP" };
        }

        const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
        if (!isValid) {
            return { success: false, error: "Invalid verification code" };
        }

        // Update Verification Status
        if (!user.verification) {
            user.verification = { email: true, mobile: false, identity: false, payment: false };
        } else {
            user.verification.email = true;
        }

        user.emailVerified = true; // Legacy support

        await user.save();
        await EmailOTP.deleteOne({ _id: otpRecord._id });

        revalidatePath("/verification");
        revalidatePath("/profile");

        return { success: true, verification: user.verification };
    } catch (err) {
        console.error("verifyEmailOTP failure:", err);
        return { success: false, error: "Failed to verify. Please try again." };
    }
}

/**
 * Get current verification status
 */
export async function getVerificationStatus() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        await connectToDatabase();
        const user = await User.findById(session.user.id).select('verification');

        return {
            success: true,
            verification: user?.verification || {
                email: false,
                mobile: false,
                identity: false,
                payment: false
            }
        };
    } catch (err) {
        return { success: false, error: "Failed to load status" };
    }
}
