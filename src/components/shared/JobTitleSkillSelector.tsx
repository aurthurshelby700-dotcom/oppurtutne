"use client";

import { useState, useMemo, useEffect } from "react";
import { Check, X, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { JOB_TITLES_DATA, getSkillsForJobTitles } from "@/lib/jobTitles";

interface JobTitleSkillSelectorProps {
    selectedJobTitles: string[];
    selectedSkills: string[];
    onJobTitlesChange: (titles: string[]) => void;
    onSkillsChange: (skills: string[]) => void;
    maxJobTitles?: number;
    maxSkills?: number;
}

export function JobTitleSkillSelector({
    selectedJobTitles,
    selectedSkills,
    onJobTitlesChange,
    onSkillsChange,
    maxJobTitles = 5, // Reasonable default
    maxSkills = 15
}: JobTitleSkillSelectorProps) {
    // --- JOB TITLE STATE ---
    const [jobTitleOpen, setJobTitleOpen] = useState(false);
    const [jobTitleSearch, setJobTitleSearch] = useState("");

    // --- SKILL STATE ---
    const [skillOpen, setSkillOpen] = useState(false);
    const [skillSearch, setSkillSearch] = useState("");

    // Filtered Job Titles
    const filteredJobTitles = useMemo(() => {
        if (!jobTitleSearch) return JOB_TITLES_DATA;
        return JOB_TITLES_DATA.filter(j =>
            j.title.toLowerCase().includes(jobTitleSearch.toLowerCase())
        );
    }, [jobTitleSearch]);

    // Available Skills (dependent on selected Job Titles)
    const availableSkills = useMemo(() => {
        return getSkillsForJobTitles(selectedJobTitles);
    }, [selectedJobTitles]);

    // Filtered Skills
    const filteredSkills = useMemo(() => {
        if (!skillSearch) return availableSkills;
        return availableSkills.filter(s =>
            s.toLowerCase().includes(skillSearch.toLowerCase())
        );
    }, [skillSearch, availableSkills]);

    // Toggle Job Title
    const toggleJobTitle = (title: string) => {
        if (selectedJobTitles.includes(title)) {
            // Remove
            const newTitles = selectedJobTitles.filter(t => t !== title);
            onJobTitlesChange(newTitles);

            // Cleanup Skills: Remove skills that are no longer valid for the new set of titles
            const validSkills = getSkillsForJobTitles(newTitles);
            const newSkills = selectedSkills.filter(s => validSkills.includes(s));
            if (newSkills.length !== selectedSkills.length) {
                onSkillsChange(newSkills);
            }
        } else {
            // Add
            if (selectedJobTitles.length < maxJobTitles) {
                onJobTitlesChange([...selectedJobTitles, title]);
            }
        }
    };

    // Toggle Skill
    const toggleSkill = (skill: string) => {
        if (selectedSkills.includes(skill)) {
            onSkillsChange(selectedSkills.filter(s => s !== skill));
        } else {
            if (selectedSkills.length < maxSkills) {
                onSkillsChange([...selectedSkills, skill]);
            }
        }
    };

    // Close dropdowns on click outside (simple implementation using backdrop)
    const closeAll = () => {
        setJobTitleOpen(false);
        setSkillOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* --- JOB TITLE SECTION --- */}
            <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Job Titles <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                    <div
                        className="flex flex-wrap gap-2 p-2 border rounded-lg bg-background min-h-[42px] focus-within:ring-2 focus-within:ring-primary/20 transition-all cursor-text"
                        onClick={() => { setJobTitleOpen(true); setSkillOpen(false); }}
                    >
                        {selectedJobTitles.map((title) => (
                            <span key={title} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm flex items-center gap-1 border border-primary/20">
                                {title}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleJobTitle(title); }}
                                    className="hover:text-destructive focus:outline-none"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            className="flex-1 bg-transparent outline-none min-w-[120px] text-sm py-1"
                            placeholder={selectedJobTitles.length === 0 ? "Select job titles..." : ""}
                            value={jobTitleSearch}
                            onChange={(e) => { setJobTitleSearch(e.target.value); setJobTitleOpen(true); }}
                            onFocus={() => { setJobTitleOpen(true); setSkillOpen(false); }}
                        />
                        <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto self-center" />
                    </div>

                    {jobTitleOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setJobTitleOpen(false)}></div>
                            <div className="absolute z-20 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-60 overflow-y-auto">
                                {filteredJobTitles.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center">No job titles found.</div>
                                ) : (
                                    <div className="grid grid-cols-1">
                                        {filteredJobTitles.map(item => (
                                            <button
                                                key={item.title}
                                                type="button"
                                                onClick={() => { toggleJobTitle(item.title); setJobTitleSearch(""); }}
                                                className={cn(
                                                    "flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left",
                                                    selectedJobTitles.includes(item.title) && "bg-muted font-medium"
                                                )}
                                            >
                                                {item.title}
                                                {selectedJobTitles.includes(item.title) && <Check className="h-4 w-4" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
                <p className="text-[10px] text-muted-foreground">Select up to {maxJobTitles} job titles.</p>
            </div>

            {/* --- SKILL SECTION --- */}
            <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Skills <span className="text-destructive">*</span>
                </label>

                {selectedJobTitles.length === 0 ? (
                    <div className="p-3 border border-dashed rounded-lg text-sm text-muted-foreground text-center bg-muted/20">
                        Please select a Job Title first to see available skills.
                    </div>
                ) : (
                    <div className="relative">
                        <div
                            className="flex flex-wrap gap-2 p-2 border rounded-lg bg-background min-h-[42px] focus-within:ring-2 focus-within:ring-primary/20 transition-all cursor-text"
                            onClick={() => { setSkillOpen(true); setJobTitleOpen(false); }}
                        >
                            {selectedSkills.map((skill) => (
                                <span key={skill} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1">
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); toggleSkill(skill); }}
                                        className="hover:text-destructive focus:outline-none"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                className="flex-1 bg-transparent outline-none min-w-[120px] text-sm py-1"
                                placeholder={selectedSkills.length === 0 ? "Select skills..." : ""}
                                value={skillSearch}
                                onChange={(e) => { setSkillSearch(e.target.value); setSkillOpen(true); }}
                                onFocus={() => { setSkillOpen(true); setJobTitleOpen(false); }}
                            />
                            <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto self-center" />
                        </div>

                        {skillOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setSkillOpen(false)}></div>
                                <div className="absolute z-20 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-60 overflow-y-auto">
                                    {filteredSkills.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground text-center">No skills found for selected Job Titles.</div>
                                    ) : (
                                        <div className="grid grid-cols-1">
                                            {filteredSkills.map(skill => (
                                                <button
                                                    key={skill}
                                                    type="button"
                                                    onClick={() => { toggleSkill(skill); setSkillSearch(""); }}
                                                    className={cn(
                                                        "flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left",
                                                        selectedSkills.includes(skill) && "bg-muted font-medium"
                                                    )}
                                                >
                                                    {skill}
                                                    {selectedSkills.includes(skill) && <Check className="h-4 w-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        <p className="text-[10px] text-muted-foreground">Select up to {maxSkills} skills.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
