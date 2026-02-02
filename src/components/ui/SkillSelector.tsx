"use client";

import { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SKILL_CATEGORIES, ALL_SKILLS } from "@/lib/categories";

interface SkillSelectorProps {
    selectedSkills: string[];
    onChange: (skills: string[]) => void;
    category?: string; // Optional: if provided, prioritize skills from this category
    maxSkills?: number;
}

export function SkillSelector({ selectedSkills, onChange, category, maxSkills = 10 }: SkillSelectorProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Determine available skills based on search term
    // Determine available skills based on search term and category
    const filteredSkills = useMemo(() => {
        let availableSkills = ALL_SKILLS;

        if (category) {
            const categoryData = SKILL_CATEGORIES.find(c => c.name === category);
            if (categoryData) {
                availableSkills = categoryData.skills;
            }
        }

        if (search) {
            return availableSkills.filter(s => s.toLowerCase().includes(search.toLowerCase()));
        }

        return availableSkills;
    }, [search, category]);

    const toggleSkill = (skill: string) => {
        if (selectedSkills.includes(skill)) {
            onChange(selectedSkills.filter(s => s !== skill));
        } else {
            if (selectedSkills.length < maxSkills) {
                onChange([...selectedSkills, skill]);
            }
        }
    };

    return (
        <div className="relative">
            <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-lg bg-background min-h-[42px] focus-within:ring-2 focus-within:ring-primary/20 transition-all">
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
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                // onBlur={() => setTimeout(() => setOpen(false), 200)} // Delay for click handling
                />
            </div>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}></div>
                    <div className="absolute z-20 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-60 overflow-y-auto">
                        {filteredSkills.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">No skills found.</div>
                        ) : (
                            <div className="grid grid-cols-1">
                                {filteredSkills.map(skill => (
                                    <button
                                        key={skill}
                                        type="button"
                                        onClick={() => { toggleSkill(skill); setSearch(""); }}
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
            <p className="text-xs text-muted-foreground mt-1">
                {selectedSkills.length}/{maxSkills} skills selected.
            </p>
        </div>
    );
}
