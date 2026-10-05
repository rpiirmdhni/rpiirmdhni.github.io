/*
    All content below is copied verbatim from index.html.
    Components render this data with the exact same markup/classes as the original.
*/

export type NavItem = {
    id: string;
    label: string;
};

export const navItems: NavItem[] = [
    { id: "home", label: "Home" },
    { id: "aboutme", label: "About Me" },
    { id: "projects", label: "Projects" },
    { id: "contact", label: "Contact" },
];

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

export const projects: Project[] = [
    {
        title: "LiteSpeak",
        image: "assets/img/projects/litespeak.png",
        description: "LiteSpeak is a zero-setup, open-source IoT platform combining an MQTT Broker, REST API, and native AI (MCP) integration.",
        links: [
            { type: "github", href: "https://github.com/rpiirmdhni/LiteSpeak", label: "View on Github" },
            { type: "npm", href: "https://www.npmjs.com/package/@rpiirmdhni/litespeak", label: "View on NPM" },
        ],
    },
    {
        title: "ECOTRA Mobile App",
        image: "assets/img/projects/ecotra.png",
        description: "ECOTRA is a PKM-KC project that develops an IoT- and AI-based system to monitor chili plant conditions, detect diseases, and provide recommended actions such as spraying through a mobile application.",
        badge: "Private",
    },
    {
        title: "ECOTRA Brand Guidelines",
        image: "assets/img/projects/ecotra-brand.png",
        description: "ECOTRA is a PKM-KC project that develops an IoT- and AI-based system to monitor chili plant conditions, detect diseases, and provide recommended actions such as spraying through a mobile application.",
        links: [
            { type: "figma", href: "https://www.figma.com/design/y0oIzAtuXkajTUnXwtrItu/ECOTRA---Brand-Assets?node-id=0-1&t=T0Crv0qH5QTFJFou-1", label: "View on Figma" },
        ],
    },
    {
        title: "Nineteen Million (AI) Jobs - NMJ",
        image: "assets/img/projects/nmj.png",
        description: "Nineteen Million (AI) Jobs is an open-source dashboard for creating, configuring, and managing hierarchical AI agent workforces.",
        links: [
            { type: "github", href: "https://github.com/rpiirmdhni/nmj", label: "View on Github" },
        ],
    },
    {
        title: "My Gunadarma",
        image: "assets/img/projects/myug.png",
        description: "My Gunadarma is a Laravel-based academic web application featuring QR code attendance and an e-library, developed by Group 4 for the Midterm Project and Exam in the KSTSI C course at Gunadarma University.",
        links: [
            { type: "github", href: "https://github.com/rpiirmdhni/my-gunadarma", label: "View on Github" },
        ],
    }
];

export type TimelineEntry = {
    period: string;
    title: string;
    organization: string;
    badge?: string;
    /** `true` = filled blue dot (ongoing), `false` = hollow dot (past) */
    current: boolean;
};

export const experiences: TimelineEntry[] = [
    { period: "2021 - Present", title: "Founder & CEO", badge: "Self-Employed", organization: "Meluna", current: true },
    { period: "2025 - Present", title: "Expert", badge: "Freelance", organization: "GLG (Gerson Lehrman Group)", current: true },
    { period: "2025 - Present", title: "Owner", badge: "Self-Employed", organization: "Sini Boga Nusantara", current: true },
    { period: "2025 - Present", title: "Member", organization: "GDGoC @ Gunadarma University", current: true },
    { period: "2024", title: "Facilitator", organization: "GreenZInitiative Indonesia", current: false },
    { period: "2023", title: "Duta Inisiatif Indonesia 2023 (Banten)", organization: "GreenZInitiative Indonesia", current: false },
];

export const educations: TimelineEntry[] = [
    { period: "2025 - Present", title: "System Informations", organization: "Gunadarma University", current: true },
    { period: "2022 - 2025", title: "Software Engineering", organization: "SMK Negeri 4 Kota Tangerang", current: false },
];

export type Language = {
    name: string;
    level: string;
    percent: number;
};

export const languages: Language[] = [
    { name: "Indonesian", level: "Native or Bilingual Proficiency", percent: 100 },
    { name: "English", level: "Professional Working Proficiency", percent: 80 },
];

export type SkillGroup = {
    title: string;
    items: string[];
};

export const skillGroups: SkillGroup[] = [
    {
        title: "Tech Stack",
        items: ["JavaScript", "Node.js", "React", "Next.js", "Express.js", "Expo", "PHP", "Laravel", "Python", "TailwindCSS", "shadcn", "Fastify", "SQLite", "Azure"],
    },
    {
        title: "Design",
        items: ["Figma", "Canva", "Capcut", "Remotion"],
    },
    {
        title: "Tools",
        items: ["Visual Studio Code", "Antigravity", "Claude Code", "Codex", "Kilo Code", "Cursor", "Hermes Agent", "OpenClaw"],
    },
    {
        title: "Soft Skills",
        items: ["Communications", "Teamwork", "Problem Solving", "Adaptability", "Critical Thinking", "Creativity", "Leadership"],
    },
];

export const aboutStats = [
    { value: "19", label: "Years Old (in 2026)" },
    { value: "~162 cm", label: "Height" },
    { value: "~70 kg", label: "Weight" },
];
