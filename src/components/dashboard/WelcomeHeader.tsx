"use client";

import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";

const QUOTES = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Opportunities don't happen, you create them.", author: "Chris Grosser" },
    { text: "It is never too late to be what you might have been.", author: "George Eliot" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
];

export function WelcomeHeader() {
    const { user } = useUser();
    const [quote, setQuote] = useState(QUOTES[0]);

    useEffect(() => {
        // Randomize quote on mount (client-side only to avoid hydration mismatch)
        const randomIndex = Math.floor(Math.random() * QUOTES.length);
        setQuote(QUOTES[randomIndex]);
    }, []);

    // Get first name safely
    const firstName = user?.name?.split(' ')[0] || "there";

    return (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/10 mb-6 relative overflow-hidden">
            <div className="relative z-10">
                <h1 className="text-xl font-bold tracking-tight mb-2">
                    Welcome back, {firstName}!
                </h1>

                <div className="max-w-2xl">
                    <p className="text-muted-foreground italic text-sm mb-1">
                        "{quote.text}"
                    </p>
                    <p className="text-xs font-semibold text-primary/80">
                        — {quote.author}
                    </p>
                </div>
            </div>
        </div>
    );
}
