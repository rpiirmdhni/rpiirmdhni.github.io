import * as React from "react";
import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<"div"> & {
    id?: string;
};

function Card({ className, id, ...props }: CardProps) {
    return (
        <div
            id={id}
            data-slot="card"
            className={cn(
                "border border-taupe-950/15 p-6 rounded-2xl w-full h-fit flex flex-col gap-6 [&:has([data-slot=card-header])]:p-0 [&:has([data-slot=card-content])]:p-0 [&:has([data-slot=card-footer])]:p-0 [&:has([data-slot=card-header])]:gap-0 [&:has([data-slot=card-content])]:gap-0 [&:has([data-slot=card-footer])]:gap-0",
                className
            )}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-header"
            className={cn("flex flex-col gap-1.5 p-4 sm:p-5", className)}
            {...props}
        />
    );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-title"
            className={cn("font-semibold leading-none tracking-tight text-lg", className)}
            {...props}
        />
    );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-description"
            className={cn("text-sm text-slate-400", className)}
            {...props}
        />
    );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-content"
            className={cn("p-4 sm:p-5 pt-0", className)}
            {...props}
        />
    );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-footer"
            className={cn("flex items-center p-4 sm:p-5 pt-0", className)}
            {...props}
        />
    );
}

export default Card;
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
