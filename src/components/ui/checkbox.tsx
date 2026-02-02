"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, onCheckedChange, checked, ...props }, ref) => {
        return (
            <label className="relative flex items-center justify-center w-4 h-4 cursor-pointer">
                <input
                    type="checkbox"
                    className="peer appearance-none w-4 h-4 border border-primary rounded-sm bg-background checked:bg-primary checked:text-primary-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    ref={ref}
                    checked={checked}
                    onChange={(e) => onCheckedChange?.(e.target.checked)}
                    {...props}
                />
                <Check className="w-3 h-3 absolute text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none" />
            </label>
        );
    }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
