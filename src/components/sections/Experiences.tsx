import { experiences } from "@/data/portfolio";
import Card from "../ui/Card";
import Timeline from "../ui/Timeline";

export default function Experiences() {
    return (
        <Card>
            <h4 className="text-xl md:text-2xl font-semibold">Experiences</h4>
            <Timeline items={experiences} />
        </Card>
    );
}
