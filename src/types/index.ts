export type UserRole = "freelancer" | "client" | "both" | "pending";

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
    title?: string;
    bio?: string;
    skills?: string[];
    location?: string;
    avatar_url?: string;
    cover_url?: string;
    created_at: string;
}

export interface Service {
    id: string;
    title: string;
    description: string;
    price: number;
    created_by: string;
    created_at: string;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    budget: number;
    created_by: string;
    status: 'open' | 'closed';
    created_at: string;
}

export interface Contest {
    id: string;
    title: string;
    description: string;
    prize: number;
    created_by: string;
    status: 'open' | 'closed';
    created_at: string;
}
