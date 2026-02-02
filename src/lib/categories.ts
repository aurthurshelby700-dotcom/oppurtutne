export const SKILL_CATEGORIES = [
    {
        name: "Video & Animation",
        skills: ["Video Editing", "Short-form / Reels Editing", "Motion Graphics", "Animation", "Color Correction"]
    },
    {
        name: "Photo & Image Editing",
        skills: ["Photo Editing", "Retouching", "Background Removal", "Image Enhancement", "Thumbnail Design"]
    },
    {
        name: "Graphic Design",
        skills: ["Logo Design", "Banner / Poster Design", "Social Media Creatives", "Brand Identity", "Presentation Design"]
    },
    {
        name: "Web Development",
        skills: ["Frontend Development", "Backend Development", "Full Stack Development", "WordPress", "Website Maintenance"]
    },
    {
        name: "App Development",
        skills: ["Android Development", "iOS Development", "Flutter / React Native", "App UI Integration"]
    },
    {
        name: "Writing & Content",
        skills: ["Content Writing", "Article Writing", "Blog Writing", "Copywriting", "Product Descriptions"]
    },
    {
        name: "Translation & Transcription",
        skills: ["Language Translation", "Transcription", "Subtitling", "Proofreading", "Editing"]
    },
    {
        name: "Digital Marketing",
        skills: ["Social Media Management", "SEO", "Paid Ads", "Email Marketing", "Influencer Outreach"]
    },
    {
        name: "UI / UX Design",
        skills: ["UI Design", "UX Research", "Wireframing", "Prototyping", "Design Systems"]
    },
    {
        name: "Data & Virtual Assistance",
        skills: ["Data Entry", "Web Research", "Virtual Assistant", "CRM Management", "Admin Support"]
    },
    {
        name: "Programming & Software",
        skills: ["Python", "JavaScript", "Java", "API Development", "Automation Scripts"]
    },
    {
        name: "Audio & Voice",
        skills: ["Voice Over", "Audio Editing", "Podcast Editing", "Sound Mixing"]
    },
    {
        name: "Business & Support",
        skills: ["Customer Support", "Lead Generation", "Sales Support", "Market Research"]
    }
];

export const ALL_SKILLS = Array.from(new Set(SKILL_CATEGORIES.flatMap(c => c.skills)));
