"use server";

import connectToDatabase from "@/lib/db";
import Service from "@/models/Service";
import Project from "@/models/Project";
import Contest from "@/models/Contest";
import User from "@/models/User";
import SavedItem from "@/models/SavedItem";
import { auth } from "@/auth";

import { SKILL_CATEGORIES } from "@/lib/categories";
import { MOCK_SERVICES, MOCK_PROJECTS, MOCK_CONTESTS, MOCK_FREELANCERS, MOCK_COURSES } from "@/lib/mock-data";

export async function fetchServices(category?: string, skills?: string[]) {
    const session = await auth();
    if (!session) return [];

    try {
        await connectToDatabase();

        const query: any = { status: 'active' };
        if (category) {
            query.category = category;
        }
        if (skills && skills.length > 0) {
            // Using regex for flexible matching or exact match if preferred. 
            // Since skills are likely stored as strings, $in with regex is safer for mixed case, but strict strings are better for perf if normalized.
            // Given the data structure, items have an array of skills.
            // We want items that have AT LEAST ONE of the selected skills? OR ALL?
            // Typically filters are "OR" (contains any), or "AND" (contains all).
            // Let's assume OR ($in) for now as it's more inclusive for browsing.
            // Also need to handle case insensitivity.
            query.skills = { $in: skills.map(s => new RegExp(`^${s}$`, 'i')) };
        }

        let services = [];
        if (session.user.role === "freelancer") {
            services = await Service.find({ createdBy: session.user.id }).sort({ createdAt: -1 }).lean();
        } else {
            services = await Service.find(query).sort({ createdAt: -1 }).lean();
        }

        // Check for saved status
        const serviceIds = services.map((s: any) => s._id);
        const savedItems = await SavedItem.find({
            user: session.user.id,
            item: { $in: serviceIds },
            itemType: "service"
        }).select("item").lean();

        const savedSet = new Set(savedItems.map((s: any) => s.item.toString()));

        const servicesWithSaved = services.map((s: any) => ({
            ...s,
            isSaved: savedSet.has(s._id.toString())
        }));

        return JSON.parse(JSON.stringify(servicesWithSaved));
    } catch (error) {
        console.error("Database Error in fetchServices:", error);
        return [];
    }
}

export async function fetchProjectsAndContests(category?: string, skills?: string[]) {
    const session = await auth();
    if (!session) return [];

    try {
        await connectToDatabase();

        if (session.user.role === "client") {
            const projects = await Project.find({ createdBy: session.user.id }).sort({ createdAt: -1 }).lean();
            const contests = await Contest.find({ createdBy: session.user.id }).sort({ createdAt: -1 }).lean();

            const combined = [
                ...projects.map(p => ({ ...p, type: 'PROJECT' })),
                ...contests.map(c => ({ ...c, type: 'CONTEST' }))
            ].sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());

            return JSON.parse(JSON.stringify(combined));
        } else {
            const query: any = { status: 'open' };
            if (category) {
                query.category = category;
            }
            if (skills && skills.length > 0) {
                query.skills = { $in: skills.map(s => new RegExp(`^${s}$`, 'i')) };
            }

            const user = await User.findById(session.user.id).lean();
            const userSkills = (user?.skills || []).map((s: string) => s.toLowerCase());

            // Exclude own projects
            query.createdBy = { $ne: session.user.id };

            const projects = await Project.find(query).sort({ createdAt: -1 }).lean();

            let contests: any[] = [];
            if (!category) {
                // Exclude own contests
                contests = await Contest.find({ status: 'open', createdBy: { $ne: session.user.id } }).sort({ createdAt: -1 }).lean();
            }

            let combined = [
                ...projects.map(p => ({ ...p, type: 'PROJECT' })),
                ...contests.map(c => ({ ...c, type: 'CONTEST' }))
            ];

            // Check for saved status
            const allIds = combined.map((i: any) => i._id);
            const savedItems = await SavedItem.find({
                user: session.user.id,
                item: { $in: allIds },
                itemType: { $in: ["project", "contest"] }
            }).select("item").lean();

            const savedSet = new Set(savedItems.map((s: any) => s.item.toString()));

            combined = combined.map((item: any) => ({
                ...item,
                isSaved: savedSet.has(item._id.toString())
            }));

            if (userSkills.length > 0) {
                combined = combined.map(item => {
                    const itemSkills = (item.skills || []).map((s: string) => s.toLowerCase());
                    const matchCount = itemSkills.filter((s: string) => userSkills.some((us: string) => us.includes(s) || s.includes(us))).length;
                    return { ...item, matchScore: matchCount };
                }).sort((a, b) => {
                    if ((b as any).matchScore !== (a as any).matchScore) {
                        return (b as any).matchScore - (a as any).matchScore;
                    }
                    return new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime();
                });
            } else {
                combined.sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());
            }

            return JSON.parse(JSON.stringify(combined));
        }
    } catch (error) {
        console.error("Database Error in fetchProjectsAndContests:", error);
        return [];
    }
}

import { unstable_noStore as noStore } from "next/cache";

export async function fetchFreelancers(category?: string, skills?: string[]) {
    noStore();
    try {
        await connectToDatabase();
        const session = await auth();

        let query: any = { role: { $in: ["freelancer", "both"] } };

        if (session?.user?.id) {
            query._id = { $ne: session.user.id };
        }

        if (skills && skills.length > 0) {
            const regexSkills = skills.map(s => new RegExp(`^${s}$`, 'i'));
            query.skills = { $in: regexSkills };
        } else if (category) {
            const categoryData = SKILL_CATEGORIES.find(c => c.name === category);
            if (categoryData && categoryData.skills.length > 0) {
                const regexSkills = categoryData.skills.map(s => new RegExp(s, 'i'));
                query.skills = { $in: regexSkills };
            }
        }

        const freelancers = await User.find(query).limit(50).lean();

        // Check for saved status
        const freelancerIds = freelancers.map((f: any) => f._id);
        const savedItems = await SavedItem.find({
            user: session?.user?.id,
            item: { $in: freelancerIds },
            itemType: "freelancer"
        }).select("item").lean();

        const savedSet = new Set(savedItems.map((s: any) => s.item.toString()));

        const freelancersWithSaved = freelancers.map((f: any) => ({
            ...f,
            isSaved: savedSet.has(f._id.toString())
        }));

        return JSON.parse(JSON.stringify(freelancersWithSaved));
    } catch (error) {
        console.error("Database Error in fetchFreelancers:", error);
        return [];
    }
}

export async function fetchFeaturedContest() {
    try {
        await connectToDatabase();
        const contest = await Contest.findOne({ status: 'open' }).sort({ prize: -1 }).lean();
        return contest ? JSON.parse(JSON.stringify(contest)) : null;
    } catch (error) {
        console.error("Database Error in fetchFeaturedContest:", error);
        return null;
    }
}

export async function fetchCourses(category?: string, skills?: string[]) {
    try {
        // Mock implementation for now
        let courses = MOCK_COURSES;

        if (category) {
            courses = courses.filter(c => c.category === category);
        }
        if (skills && skills.length > 0) {
            courses = courses.filter(c => c.skills?.some(skill => skills.includes(skill)));
        }

        // Check for saved status
        const coursesWithIds = JSON.parse(JSON.stringify(courses));
        const courseIds = coursesWithIds.map((c: any) => c._id);

        // We can save mock items too if we use their IDs
        try {
            await connectToDatabase();
            const session = await auth();
            if (session?.user?.id) {
                const savedItems = await SavedItem.find({
                    user: session.user.id,
                    item: { $in: courseIds },
                    itemType: "course"
                }).select("item").lean();

                const savedSet = new Set(savedItems.map((s: any) => s.item.toString()));

                return coursesWithIds.map((c: any) => ({
                    ...c,
                    isSaved: savedSet.has(c._id.toString())
                }));
            }
        } catch (e) {
            console.error("Error checking saved status for courses", e);
        }

        return coursesWithIds;
    } catch (error) {
        console.error("Error in fetchCourses:", error);
        return [];
    }
}

export async function getProjectById(id: string) {
    try {
        await connectToDatabase();
        const project = await Project.findById(id).populate('createdBy', 'name avatarUrl location rating reviewsCount emailVerified identityVerified paymentVerified').lean();
        if (!project) return null;
        return JSON.parse(JSON.stringify(project));
    } catch (error) {
        console.error("Error fetching project by ID:", error);
        return null; // Don't fall back to mock for simple ID lookup if real DB is active, or user specific request "remove fake data"
    }
}

export async function getContestById(id: string) {
    try {
        await connectToDatabase();
        const contest = await Contest.findById(id).populate('createdBy', 'name avatarUrl location rating reviewsCount emailVerified identityVerified paymentVerified').lean();
        if (!contest) return null;
        return JSON.parse(JSON.stringify(contest));
    } catch (error) {
        console.error("Error fetching contest by ID:", error);
        return null;
    }
}

export async function getSimilarProjects(id: string, skills: string[] = []) {
    try {
        await connectToDatabase();
        if (skills.length === 0) return [];

        // Find projects with AT LEAST ONE matching skill, excluding current project
        const projects = await Project.find({
            _id: { $ne: id },
            skills: { $in: skills.map(s => new RegExp(`^${s}$`, 'i')) },
            status: 'open'
        })
            .limit(5)
            .sort({ createdAt: -1 })
            .lean();

        return JSON.parse(JSON.stringify(projects));
    } catch (error) {
        console.error("Error fetching similar projects:", error);
        return [];
    }
}

export async function getSimilarContests(id: string, skills: string[] = []) {
    try {
        await connectToDatabase();
        if (skills.length === 0) return [];

        const contests = await Contest.find({
            _id: { $ne: id },
            skills: { $in: skills.map(s => new RegExp(`^${s}$`, 'i')) },
            status: 'open'
        })
            .limit(5)
            .sort({ createdAt: -1 })
            .lean();

        return JSON.parse(JSON.stringify(contests));
    } catch (error) {
        console.error("Error fetching similar contests:", error);
        return [];
    }
}
