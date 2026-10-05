import { educations } from "@/data/portfolio";
import Card from "../ui/Card";
import Timeline from "../ui/Timeline";

export default function Educations() {
    return (
        <Card>
            <h4 className="text-xl md:text-2xl font-semibold">Educations</h4>
            <Timeline items={educations} />
        </Card>
    );
}
