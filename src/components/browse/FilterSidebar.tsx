"use client";

import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider"; // Might need to create this later or use standard input
import { Checkbox } from "@/components/ui/checkbox"; // Might need standard input
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

// Minimal custom components for MVP if shadcn not fully installed
function FilterSection({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-border py-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between text-sm font-medium hover:text-primary mb-2"
            >
                {title}
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {isOpen && (
                <div className="space-y-2 mt-2">
                    {children}
                </div>
            )}
        </div>
    );
}

import { JOB_TITLES_DATA, getSkillsForJobTitles } from "@/lib/jobTitles";
import { Check } from "lucide-react";

interface FilterSidebarProps {
    selectedJobTitles?: string[];
    onJobTitlesChange?: (titles: string[]) => void;
    selectedSkills?: string[];
    onSkillsChange?: (skills: string[]) => void;
}

export function FilterSidebar({ selectedJobTitles = [], onJobTitlesChange, selectedSkills = [], onSkillsChange }: FilterSidebarProps) {

    const availableSkills = selectedJobTitles.length > 0 ? getSkillsForJobTitles(selectedJobTitles) : [];

    const toggleJobTitle = (title: string) => {
        if (selectedJobTitles.includes(title)) {
            onJobTitlesChange?.(selectedJobTitles.filter(t => t !== title));
        } else {
            onJobTitlesChange?.([...selectedJobTitles, title]);
        }
    };

    const toggleSkill = (skill: string) => {
        if (selectedSkills.includes(skill)) {
            onSkillsChange?.(selectedSkills.filter(s => s !== skill));
        } else {
            onSkillsChange?.([...selectedSkills, skill]);
        }
    };

    return (
        <div className="space-y-1">
            <div className="pb-4">
                <h3 className="font-semibold text-lg">Filters</h3>
            </div>

            <FilterSection title="Job Titles" defaultOpen={true}>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                    {JOB_TITLES_DATA.map((j) => (
                        <label key={j.title} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer py-1">
                            <input
                                type="checkbox"
                                className="rounded border-border text-primary focus:ring-primary"
                                checked={selectedJobTitles.includes(j.title)}
                                onChange={() => toggleJobTitle(j.title)}
                            />
                            {j.title}
                        </label>
                    ))}
                </div>
            </FilterSection>

            {selectedJobTitles.length > 0 && (
                <FilterSection title="Skills" defaultOpen={true}>
                    <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                        {availableSkills.map(skill => (
                            <label key={skill} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer py-1">
                                <input
                                    type="checkbox"
                                    className="rounded border-border text-primary focus:ring-primary"
                                    checked={selectedSkills.includes(skill)}
                                    onChange={() => toggleSkill(skill)}
                                />
                                {skill}
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}

            <FilterSection title="Budget">
                <div className="px-1">
                    <input type="range" min="0" max="10000" className="w-full accent-primary" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>$0</span>
                        <span>$10k+</span>
                    </div>
                </div>
            </FilterSection>

            <FilterSection title="Experience Level">
                {["Entry Level", "Intermediate", "Expert"].map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                        {c}
                    </label>
                ))}
            </FilterSection>

            <FilterSection title="Project Type">
                <label className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                    <input type="radio" name="type" className="text-primary focus:ring-primary" defaultChecked />
                    Fixed Price
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                    <input type="radio" name="type" className="text-primary focus:ring-primary" />
                    Hourly
                </label>
            </FilterSection>
        </div>
    );
}
