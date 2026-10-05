import type { ReactNode } from "react";

type CardProps = {
    id?: string;
    children: ReactNode;
};

/** The bordered content card used for every section in index.html. */
export default function Card({ id, children }: CardProps) {
    return (
        <div id={id} className="border border-taupe-950/15 p-6 rounded-2xl w-full h-fit flex flex-col gap-6">
            {children}
        </div>
    );
}
