import { languages } from "@/data/portfolio";
import Card from "../ui/Card";

export default function Languages() {
    return (
        <Card>
            <h4 className="text-xl md:text-2xl font-semibold">Languages</h4>
            <div className="flex flex-col gap-4">
                {languages.map((language) => (
                    <div key={language.name} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm md:text-base">
                            <span className="font-medium">{language.name}</span>
                            <span className="text-xs md:text-sm text-taupe-950/50">{language.level}</span>
                        </div>
                        <div className="w-full bg-taupe-950/15 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#5B8CFF] h-full rounded-full" style={{ width: `${language.percent}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
