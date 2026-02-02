"use client";

import { useUser } from "@/context/UserContext";
import { ServiceForm } from "@/components/dashboard/ServiceForm";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PostServicePage() {
    const { activeMode, user } = useUser();
    const router = useRouter();

    // Redirect if not freelancer/both
    useEffect(() => {
        if (activeMode !== 'freelancer' && user?.role !== 'both') {
            if (user) router.push('/');
        }
    }, [activeMode, user, router]);

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Post a Service</h1>
                <p className="text-muted-foreground mt-2">
                    Create a new service offering to start earning based on your skills.
                </p>
            </div>

            <ServiceForm
                onSuccess={() => router.push('/my-services')}
                onCancel={() => router.back()}
            />
        </div>
    );
}
