/* eslint-disable @next/next/no-img-element */
import type { Project, ProjectLink } from "@/data/portfolio";
import { FigmaIcon, GithubIcon, NpmIcon } from "../icons";
import Badge from "../ui/Badge";

const linkIcons: Record<ProjectLink["type"], typeof GithubIcon> = {
    github: GithubIcon,
    npm: NpmIcon,
    figma: FigmaIcon,
};

type ProjectSlideProps = {
    project: Project;
};

/** One slide of the Featured Projects carousel. */
export default function ProjectSlide({ project }: ProjectSlideProps) {
    const title = <h4 className="text-xl md:text-2xl font-medium">{project.title}</h4>;

    return (
        <li className="splide__slide">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                <div className="w-full md:w-xs shrink-0">
                    <img src={project.image} alt={project.title} className="rounded-xl w-full" />
                </div>
                <div className="flex flex-col gap-4 w-full">
                    {project.badge ? (
                        <div className="flex items-center gap-2">
                            {title}
                            <Badge>{project.badge}</Badge>
                        </div>
                    ) : (
                        title
                    )}
                    <p className="text-sm md:text-base">{project.description}</p>
                    {project.links && project.links.length > 0 && (
                        <div className="flex items-center gap-2">
                            {project.links.map((link) => {
                                const Icon = linkIcons[link.type];
                                return (
                                    <a key={link.href} href={link.href} target="_blank" className="border border-taupe-950/15 px-4 py-1 text-sm rounded-full flex justify-center items-center gap-2">
                                        <Icon size={20} />
                                        <span>{link.label}</span>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
}
