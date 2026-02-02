"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// Assuming Radix UI is installed, if not we fall back to simple input
// To be safe I will implement a simple HTML input wrapper first to avoid dependency issues if radix is not installed.
// Wait, package.json showed "class-variance-authority", "clsx", "lucide-react", "tailwind-merge".
// It did NOT show radix-ui.
// So I should implement a pure CSS/HTML slider and checkbox to be safe and avoid `npm install` delays/permissions.

/* Simple Custom Slider */
interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
    value: number[];
    onValueChange: (val: number[]) => void;
    max: number;
    step: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, value, onValueChange, max, step, ...props }, ref) => {
        return (
            <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
                <input
                    type="range"
                    min={0}
                    max={max}
                    step={step}
                    value={value[0]}
                    onChange={(e) => onValueChange([Number(e.target.value)])}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    ref={ref}
                    {...props}
                />
            </div>
        );
    }
);
Slider.displayName = "Slider";

export { Slider };
