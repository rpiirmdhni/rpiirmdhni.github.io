type TagProps = {
    children: string;
};

/** Pill used in the Skills card. */
export default function Tag({ children }: TagProps) {
    return (
        <span className="border border-taupe-950/15 px-4 py-1 text-sm rounded-full flex justify-center items-center">{children}</span>
    );
}
