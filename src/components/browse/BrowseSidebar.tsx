import { JOB_TITLES_DATA } from "@/lib/jobTitles";
import { Filter, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrowseSidebarProps {
    type: string;
    filters: any;
    setFilters: (filters: any) => void;
}

export function BrowseSidebar({ type, filters, setFilters }: BrowseSidebarProps) {
    const handleToggle = (key: string, value: string) => {
        const current = filters[key] || [];
        const next = current.includes(value)
            ? current.filter((s: string) => s !== value)
            : [...current, value];
        setFilters({ ...filters, [key]: next });
    };

    const availableSkills = JOB_TITLES_DATA
        .filter(jt => (filters.jobTitles || []).includes(jt.title))
        .flatMap(jt => jt.skills);

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <Filter className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-xl tracking-tight">Filters</h2>
            </div>

            {/* 1. JOB TITLES */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                    Roles / Job Titles
                    {filters.jobTitles?.length > 0 && <span className="text-primary text-[10px] bg-primary/10 px-1.5 py-0.5 rounded-full">{filters.jobTitles.length}</span>}
                </h3>
                <div className="space-y-1 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {JOB_TITLES_DATA.map((jt) => (
                        <label key={jt.title} className="flex items-center gap-2 cursor-pointer group hover:bg-muted/50 p-1.5 rounded-md transition-colors">
                            <input
                                type="checkbox"
                                checked={(filters.jobTitles || []).includes(jt.title)}
                                onChange={() => handleToggle("jobTitles", jt.title)}
                                className="hidden"
                            />
                            <div className={cn(
                                "h-4 w-4 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                (filters.jobTitles || []).includes(jt.title) ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                            )}>
                                {(filters.jobTitles || []).includes(jt.title) && <Check className="h-3 w-3 text-primary-foreground stroke-[3px]" />}
                            </div>
                            <span className={cn(
                                "text-xs transition-colors",
                                (filters.jobTitles || []).includes(jt.title) ? "font-bold text-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                                {jt.title}
                            </span>
                        </label>
                    ))}
                </div>
            </div>


            {/* 3. SKILLS (Based on selection) */}
            {availableSkills.length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                        Skills
                        {filters.skills?.length > 0 && <span className="text-primary text-[10px] bg-primary/10 px-1.5 py-0.5 rounded-full">{filters.skills.length}</span>}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {availableSkills.slice(0, 15).map((skill) => (
                            <button
                                key={skill}
                                onClick={() => handleToggle("skills", skill)}
                                className={cn(
                                    "px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all",
                                    (filters.skills || []).includes(skill)
                                        ? "bg-primary/20 border-primary text-primary"
                                        : "bg-background border-border text-muted-foreground hover:border-primary/50"
                                )}
                            >
                                {skill}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* TYPE SPECIFIC FILTERS */}
            {type === "projects" && (
                <div className="space-y-3 animate-in slide-in-from-left-2 duration-300">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Budget Type</h3>
                    <div className="flex gap-2">
                        {["fixed", "hourly"].map(bt => (
                            <button
                                key={bt}
                                onClick={() => setFilters({ ...filters, budgetType: filters.budgetType === bt ? null : bt })}
                                className={cn(
                                    "flex-1 py-2 rounded-lg text-[10px] font-bold border capitalize transition-all",
                                    filters.budgetType === bt ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/30"
                                )}
                            >
                                {bt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* TIME POSTED */}
            <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Time Posted</h3>
                <div className="grid grid-cols-2 gap-2">
                    {["anytime", "today", "7days", "30days"].map((time) => (
                        <button
                            key={time}
                            onClick={() => setFilters({ ...filters, timePosted: time })}
                            className={cn(
                                "py-2 px-2 rounded-lg text-[10px] font-bold border transition-all text-center capitalize",
                                (filters.timePosted || "anytime") === time
                                    ? "bg-foreground text-background border-foreground"
                                    : "border-border text-muted-foreground hover:border-foreground/30"
                            )}
                        >
                            {time === "7days" ? "7 Days" : time === "30days" ? "30 Days" : time}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clear Filters */}
            <button
                onClick={() => setFilters({ jobTitles: [], skills: [], timePosted: "anytime" })}
                className="w-full py-3 text-[10px] font-bold text-destructive hover:bg-destructive/10 transition-all border border-destructive/20 rounded-lg mt-4 uppercase tracking-widest flex items-center justify-center gap-2"
            >
                Reset Filters
            </button>
        </div>
    );
}

