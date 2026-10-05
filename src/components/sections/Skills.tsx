import { Fragment } from "react";
import { skillGroups } from "@/data/portfolio";
import Card from "../ui/Card";
import Tag from "../ui/Tag";

export default function Skills() {
    return (
        <Card>
            <h3 className="text-2xl md:text-3xl font-semibold">Skills</h3>
            {skillGroups.map((group, index) => (
                <Fragment key={group.title}>
                    {index > 0 && <hr className="border-taupe-950/15" />}
                    <div className="flex flex-col gap-4">
                        <h5 className="text-lg md:text-xl font-semibold">{group.title}</h5>
                        <div className="flex gap-2 flex-wrap">
                            {group.items.map((item) => (
                                <Tag key={item}>{item}</Tag>
                            ))}
                        </div>
                    </div>
                </Fragment>
            ))}
        </Card>
    );
}
