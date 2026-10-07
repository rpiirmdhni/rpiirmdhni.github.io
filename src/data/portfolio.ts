import portfolioData from "./portfolio.json";

export type NavItem = {
    id: string;
    label: string;
};

export type ProjectLink = {
    type: "github" | "npm" | "figma";
    href: string;
    label: string;
};

export type Project = {
    title: string;
    image: string;
    description: string;
    badge?: string;
    links?: ProjectLink[];
};

export type TimelineEntry = {
    period: string;
    title: string;
    organization: string;
    badge?: string;
    current: boolean;
};

export type Language = {
    name: string;
    level: string;
    percent: number;
};

export type SkillGroup = {
    title: string;
    items: string[];
};

export type StatItem = {
    value: string;
    label: string;
};

export const navItems: NavItem[] = portfolioData.navItems;
export const projects: Project[] = portfolioData.projects as Project[];
export const experiences: TimelineEntry[] = portfolioData.experiences;
export const educations: TimelineEntry[] = portfolioData.educations;
export const languages: Language[] = portfolioData.languages;
export const skillGroups: SkillGroup[] = portfolioData.skillGroups;
export const aboutStats: StatItem[] = portfolioData.aboutStats;
