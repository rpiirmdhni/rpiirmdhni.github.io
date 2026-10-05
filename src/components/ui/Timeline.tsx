import type { TimelineEntry } from "@/data/portfolio";
import Badge from "./Badge";

type TimelineProps = {
    items: TimelineEntry[];
};

/** Vertical timeline used by the Experiences and Educations cards. */
export default function Timeline({ items }: TimelineProps) {
    return (
        <div className="flex flex-col ml-3 mt-2 border-l border-taupe-950/15">
            {items.map((item) => (
                <TimelineItem key={`${item.period}-${item.title}`} item={item} />
            ))}
        </div>
    );
}

function TimelineItem({ item }: { item: TimelineEntry }) {
    const title = <h5 className="text-lg md:text-xl font-medium">{item.title}</h5>;

    return (
        <div className="relative pl-6 pb-8 last:pb-0">
            {item.current ? (
                <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#5B8CFF] ring-4 ring-olive-50"></div>
            ) : (
                <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border border-taupe-950/30 bg-olive-50 ring-4 ring-olive-50"></div>
            )}
            <div className="flex flex-col gap-1 -mt-1.5">
                <span className="text-xs font-medium tracking-widest text-taupe-950/50 uppercase">{item.period}</span>
                {item.badge ? (
                    <div className="flex items-center gap-2">
                        {title}
                        <Badge>{item.badge}</Badge>
                    </div>
                ) : (
                    title
                )}
                <span className="text-sm md:text-base text-taupe-950/50">{item.organization}</span>
            </div>
        </div>
    );
}
