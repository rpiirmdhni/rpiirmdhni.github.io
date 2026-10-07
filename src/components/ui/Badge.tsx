import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.ComponentProps<"span"> & {
    variant?: "default" | "secondary" | "destructive" | "outline";
};

function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
    const variantClasses = {
        default: "border border-taupe-950/15 text-taupe-950/80 bg-transparent",
        secondary: "bg-slate-800 text-slate-200 border border-slate-700",
        destructive: "bg-red-950 text-red-300 border border-red-800",
        outline: "border border-slate-700 text-slate-300 bg-transparent",
    };

    return (
        <span
            className={cn(
                "px-2.5 py-0.5 text-xs font-medium rounded-full inline-flex items-center justify-center gap-1.5 transition-colors",
                variantClasses[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}

export default Badge;
export { Badge };
