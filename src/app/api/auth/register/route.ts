import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import Wallet from "@/models/Wallet";
import Transaction from "@/models/Transaction";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { firstName, lastName, username, email, password } = body;

        // Validation
        if (!firstName || !lastName || !username || !email || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Check for existing user
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });

        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return NextResponse.json(
                    { error: "Email already exists" },
                    { status: 409 }
                );
            }
            if (existingUser.username === username.toLowerCase()) {
                return NextResponse.json(
                    { error: "Username already taken" },
                    { status: 409 }
                );
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");

        // Create User
        const newUser = await User.create({
            firstName,
            lastName,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            passwordHash,
            verificationToken,
            role: "both", // Default per requirements
            emailVerified: false
        });

        // Create Wallet and Welcome Bonus
        const newWallet = await Wallet.create({
            userId: newUser._id,
            username: newUser.username,
            balance: 1000, // Initialize with bonus directly
            currency: "USD"
        });

        await Transaction.create({
            walletId: newWallet._id,
            type: "credit",
            amount: 1000,
            reason: "welcome_bonus",
            description: "Welcome Bonus",
            createdAt: new Date()
        });

        // TODO: Send verification email here
        // await sendVerificationEmail(email, verificationToken);

        return NextResponse.json(
            { message: "User created successfully" },
            { status: 201 }
        );

    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
