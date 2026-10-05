type BadgeProps = {
    children: string;
};

/** Small muted badge (e.g. "Private", "Self-Employed", "Freelance"). */
export default function Badge({ children }: BadgeProps) {
    return (
        <span className="border border-taupe-950/15 px-2 py-px text-sm rounded-full flex justify-center items-center gap-2">
            <span className="text-xs md:text-sm text-taupe-950/50">{children}</span>
        </span>
    );
}
