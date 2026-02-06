export interface JobTitleData {
    title: string;
    skills: string[];
}

export const JOB_TITLES_DATA: JobTitleData[] = [
    {
        title: "Accounting & Finance",
        skills: ["Bookkeeping", "Tally / QuickBooks", "Financial Reporting", "Tax Filing", "Budgeting"]
    },
    {
        title: "AI & Machine Learning",
        skills: ["Machine Learning", "Python", "TensorFlow / PyTorch", "Chatbots", "Model Training"]
    },
    {
        title: "Business & Project Management",
        skills: ["Project Planning", "Agile / Scrum", "Documentation", "Client Communication", "Risk Management"]
    },
    {
        title: "Cloud & DevOps",
        skills: ["AWS", "Docker", "Kubernetes", "CI/CD Pipelines", "Server Management"]
    },
    {
        title: "Content Writing",
        skills: ["Blog Writing", "SEO Content", "Copywriting", "Script Writing", "Proofreading"]
    },
    {
        title: "Cybersecurity",
        skills: ["Ethical Hacking", "Penetration Testing", "Network Security", "OWASP", "Vulnerability Assessment"]
    },
    {
        title: "Data Analysis",
        skills: ["Python", "SQL", "Excel", "Power BI", "Data Visualization"]
    },
    {
        title: "Digital Marketing",
        skills: ["SEO", "Google Ads", "Facebook Ads", "Social Media Marketing", "Analytics"]
    },
    {
        title: "Graphic Design",
        skills: ["Logo Design", "Branding", "Photoshop", "Illustrator", "Social Media Creatives"]
    },
    {
        title: "Mobile App Development",
        skills: ["Flutter", "React Native", "Android (Kotlin)", "iOS (Swift)", "Firebase Integration"]
    },
    {
        title: "Sales & Customer Support",
        skills: ["CRM Tools", "Lead Generation", "Email Handling", "Chat Support", "Sales Pitching"]
    },
    {
        title: "UI / UX Design",
        skills: ["Figma", "Adobe XD", "Wireframing", "Prototyping", "User Experience Research"]
    },
    {
        title: "Video Editing & Animation",
        skills: ["Premiere Pro", "After Effects", "Motion Graphics", "Reels & Shorts Editing", "Color Grading"]
    },
    {
        title: "Virtual Assistance",
        skills: ["Data Entry", "Email Management", "Scheduling", "Research", "MS Office / Google Workspace"]
    },
    {
        title: "Web Development",
        skills: ["HTML", "CSS", "JavaScript", "React", "Next.js", "Vue", "Node.js", "PHP", "Laravel", "REST API", "GraphQL", "Website Optimization"]
    }
];

export const ALL_JOB_TITLES = JOB_TITLES_DATA.map(j => j.title);
export const ALL_SKILLS = Array.from(new Set(JOB_TITLES_DATA.flatMap(j => j.skills)));

export function getSkillsForJobTitles(jobTitles: string[]): string[] {
    return Array.from(new Set(
        JOB_TITLES_DATA
            .filter(j => jobTitles.includes(j.title))
            .flatMap(j => j.skills)
    ));
}

export function isValidJobTitle(title: string): boolean {
    return ALL_JOB_TITLES.includes(title);
}

export function isValidSkillForJobTitles(skill: string, jobTitles: string[]): boolean {
    const validSkills = getSkillsForJobTitles(jobTitles);
    return validSkills.includes(skill);
}
