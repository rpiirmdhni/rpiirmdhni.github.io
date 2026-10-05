import { aboutStats } from "@/data/portfolio";
import Card from "../ui/Card";

export default function AboutMe() {
    return (
        <Card id="aboutme">
            <h3 className="text-2xl md:text-3xl font-semibold">About Me</h3>
            <p className="text-sm md:text-base">I&apos;m a Information System student at Gunadarma University, passionate about Technology, AI, and Creative Media. I enjoy building useful products, exploring new technologies, and turning ideas into real solutions.<br /><br />I believe in building serious things not just for today, but for the future, constantly merging strategic insights with technological innovation to bring creativity to the world.</p>
            <hr className="border-taupe-950/15" />
            <div className="flex gap-4 divide-x divide-taupe-950/15">
                {aboutStats.map((stat) => (
                    <div key={stat.label} className="flex flex-col w-full">
                        <h4 className="text-xl md:text-2xl font-medium">{stat.value}</h4>
                        <span className="text-xs md:text-sm text-taupe-950/50">{stat.label}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}
