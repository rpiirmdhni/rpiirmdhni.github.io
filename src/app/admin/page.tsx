"use client";

import { useEffect, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    BarChart3,
    Briefcase,
    CheckCircle2,
    FolderKanban,
    Globe,
    GraduationCap,
    Key,
    Loader2,
    Plus,
    Save,
    ShieldCheck,
    Trash2,
    Upload,
    Wrench,
    X,
} from "lucide-react";
import initialPortfolioData from "@/data/portfolio.json";

type ProjectLink = {
    type: "github" | "npm" | "figma";
    href: string;
    label: string;
};

type Project = {
    title: string;
    image: string;
    description: string;
    badge?: string;
    links?: ProjectLink[];
};

type TimelineEntry = {
    period: string;
    title: string;
    organization: string;
    badge?: string;
    current: boolean;
};

type Language = {
    name: string;
    level: string;
    percent: number;
};

type SkillGroup = {
    title: string;
    items: string[];
};

type StatItem = {
    value: string;
    label: string;
};

type PortfolioData = {
    navItems: { id: string; label: string }[];
    projects: Project[];
    experiences: TimelineEntry[];
    educations: TimelineEntry[];
    languages: Language[];
    skillGroups: SkillGroup[];
    aboutStats: StatItem[];
};

export default function AdminPage() {
    const [token, setToken] = useState("");
    const [repo, setRepo] = useState("rpiirmdhni/rpiirmdhni.github.io");
    const [isConfigured, setIsConfigured] = useState(false);
    const [data, setData] = useState<PortfolioData>(initialPortfolioData as PortfolioData);
    const [activeTab, setActiveTab] = useState<"projects" | "experiences" | "educations" | "skills" | "languages" | "stats">("projects");
    const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; message: string }>({ type: "idle", message: "" });
    const [imageUploadStatus, setImageUploadStatus] = useState<string>("");

    useEffect(() => {
        const savedToken = localStorage.getItem("cms_github_token");
        const savedRepo = localStorage.getItem("cms_github_repo");
        if (savedToken) {
            setToken(savedToken);
            setIsConfigured(true);
        }
        if (savedRepo) setRepo(savedRepo);
    }, []);

    const handleSaveConfig = () => {
        if (!token.trim()) return alert("Please enter a valid GitHub Personal Access Token");
        localStorage.setItem("cms_github_token", token.trim());
        localStorage.setItem("cms_github_repo", repo.trim());
        setIsConfigured(true);
        setStatus({ type: "success", message: "GitHub authentication settings saved!" });
    };

    const handleDisconnect = () => {
        localStorage.removeItem("cms_github_token");
        setToken("");
        setIsConfigured(false);
        setStatus({ type: "idle", message: "" });
    };

    const utf8ToBase64 = (str: string) => {
        return btoa(
            encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
                String.fromCharCode(parseInt(p1, 16))
            )
        );
    };

    const handleFileUpload = async (file: File, callback: (url: string) => void) => {
        if (!token) return alert("Please configure your GitHub Token first.");
        setImageUploadStatus(`Uploading ${file.name}...`);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Data = (reader.result as string).split(",")[1];
                const cleanFileName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
                const path = `public/assets/img/projects/${cleanFileName}`;

                let sha: string | undefined;
                try {
                    const checkRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (checkRes.ok) {
                        const checkData = await checkRes.json();
                        sha = checkData.sha;
                    }
                } catch {
                    // Ignore if file does not exist yet
                }

                const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: `cms: upload image ${cleanFileName}`,
                        content: base64Data,
                        sha: sha,
                        branch: "main",
                    }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || "Failed to upload image to GitHub");
                }

                const publicUrl = `/assets/img/projects/${cleanFileName}`;
                callback(publicUrl);
                setImageUploadStatus(`Successfully uploaded to ${publicUrl}`);
            };
        } catch (err: unknown) {
            const error = err as Error;
            setImageUploadStatus(`Upload failed: ${error.message}`);
        }
    };

    const handleCommitToGitHub = async () => {
        if (!token) return alert("Please enter and save your GitHub Token first.");

        setStatus({ type: "loading", message: "Fetching latest repository info..." });

        try {
            const path = "src/data/portfolio.json";
            const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!getRes.ok) {
                const errData = await getRes.json();
                throw new Error(`GitHub API Error: ${errData.message || getRes.statusText}`);
            }

            const currentFileData = await getRes.json();
            const currentSha = currentFileData.sha;

            setStatus({ type: "loading", message: "Committing updated portfolio.json to GitHub..." });

            const updatedJsonString = JSON.stringify(data, null, 2);
            const contentBase64 = utf8ToBase64(updatedJsonString);

            const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: "cms: update portfolio contents via Admin Dashboard",
                    content: contentBase64,
                    sha: currentSha,
                    branch: "main",
                }),
            });

            if (!putRes.ok) {
                const errData = await putRes.json();
                throw new Error(`Commit failed: ${errData.message || putRes.statusText}`);
            }

            setStatus({
                type: "success",
                message: "Changes committed successfully! GitHub Actions is building and deploying your update (~30-60s to live).",
            });
        } catch (err: unknown) {
            const error = err as Error;
            setStatus({ type: "error", message: error.message || "Failed to commit data" });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans antialiased">
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
                {/* Header Navbar */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 rounded-xl p-5 shadow-xs gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Portfolio CMS</h1>
                            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">shadcn ui</span>
                        </div>
                        <p className="text-xs text-slate-500">Git-based Headless Content Manager powered by GitHub REST API</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <a
                            href="/"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Portfolio Site</span>
                        </a>

                        <button
                            onClick={handleCommitToGitHub}
                            disabled={status.type === "loading"}
                            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors shadow-2xs disabled:opacity-50"
                        >
                            {status.type === "loading" ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Publishing...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save & Commit</span>
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {/* Status Toast Alert */}
                {status.message && (
                    <div
                        className={`flex items-center gap-3 p-4 rounded-xl text-xs font-medium border shadow-2xs ${status.type === "error"
                            ? "bg-red-50 text-red-800 border-red-200"
                            : status.type === "success"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-sky-50 text-sky-800 border-sky-200"
                            }`}
                    >
                        {status.type === "error" && <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                        {status.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
                        {status.type === "loading" && <Loader2 className="w-4 h-4 shrink-0 animate-spin text-sky-600" />}
                        <span>{status.message}</span>
                    </div>
                )}

                {/* GitHub Authentication Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-slate-500" />
                            <h2 className="text-sm font-semibold text-slate-900">GitHub Authentication</h2>
                            {isConfigured ? (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    <span>Connected</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                                    <span>Not Configured</span>
                                </span>
                            )}
                        </div>
                        {isConfigured && (
                            <button onClick={handleDisconnect} className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline">
                                Disconnect
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-700">Target Repository</label>
                            <input
                                type="text"
                                value={repo}
                                onChange={(e) => setRepo(e.target.value)}
                                className="w-full text-xs border border-slate-300 p-2.5 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all font-mono"
                                placeholder="owner/repository"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-700">Personal Access Token (PAT)</label>
                            <input
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full text-xs border border-slate-300 p-2.5 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all font-mono"
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                            />
                        </div>
                    </div>

                    {!isConfigured && (
                        <div>
                            <button
                                onClick={handleSaveConfig}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Credentials</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Tab Navigation Controls */}
                <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex overflow-x-auto gap-1">
                    {[
                        { id: "projects", label: "Projects", icon: FolderKanban },
                        { id: "experiences", label: "Experiences", icon: Briefcase },
                        { id: "educations", label: "Educations", icon: GraduationCap },
                        { id: "skills", label: "Skills", icon: Wrench },
                        { id: "languages", label: "Languages", icon: Globe },
                        { id: "stats", label: "About Stats", icon: BarChart3 },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${isActive
                                    ? "bg-slate-900 text-white shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* TAB CONTENT CARDS */}
                <main className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col gap-6">
                    {/* PROJECTS TAB */}
                    {activeTab === "projects" && (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">Featured Projects</h3>
                                    <p className="text-xs text-slate-500">Manage your project showcase entries, images and repository links</p>
                                </div>
                                <button
                                    onClick={() =>
                                        setData({
                                            ...data,
                                            projects: [
                                                { title: "New Project", image: "/assets/img/projects/litespeak.png", description: "Project description", badge: "", links: [] },
                                                ...data.projects,
                                            ],
                                        })
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Project</span>
                                </button>
                            </div>

                            {imageUploadStatus && (
                                <div className="text-xs text-sky-700 bg-sky-50 border border-sky-200 p-2.5 rounded-lg font-mono flex items-center gap-2">
                                    <Upload className="w-3.5 h-3.5 text-sky-600" />
                                    <span>{imageUploadStatus}</span>
                                </div>
                            )}

                            <div className="flex flex-col gap-6">
                                {data.projects.map((project, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 flex flex-col gap-4">
                                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project #{idx + 1}</span>
                                            <button
                                                onClick={() => setData({ ...data, projects: data.projects.filter((_, i) => i !== idx) })}
                                                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-medium text-slate-700">Project Title</label>
                                                <input
                                                    type="text"
                                                    value={project.title}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].title = e.target.value;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="w-full text-xs border border-slate-300 p-2.5 rounded-lg bg-white"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-medium text-slate-700">Badge Tag (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={project.badge || ""}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].badge = e.target.value || undefined;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="w-full text-xs border border-slate-300 p-2.5 rounded-lg bg-white"
                                                    placeholder="e.g. Private / Open-Source"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-slate-700">Image Asset Path / Direct Upload</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    value={project.image}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].image = e.target.value;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="w-full text-xs border border-slate-300 p-2.5 rounded-lg bg-white font-mono"
                                                />
                                                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap">
                                                    <Upload className="w-3.5 h-3.5" />
                                                    <span>Upload Asset</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                handleFileUpload(file, (url) => {
                                                                    const copy = [...data.projects];
                                                                    copy[idx].image = url;
                                                                    setData({ ...data, projects: copy });
                                                                });
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-slate-700">Description</label>
                                            <textarea
                                                rows={2}
                                                value={project.description}
                                                onChange={(e) => {
                                                    const copy = [...data.projects];
                                                    copy[idx].description = e.target.value;
                                                    setData({ ...data, projects: copy });
                                                }}
                                                className="w-full text-xs border border-slate-300 p-2.5 rounded-lg bg-white"
                                            />
                                        </div>

                                        {/* Project Links Section */}
                                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/60">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-semibold text-slate-900">Project Action Buttons / Links</label>
                                                <button
                                                    onClick={() => {
                                                        const copy = [...data.projects];
                                                        copy[idx].links = [...(copy[idx].links || []), { type: "github", href: "", label: "View Link" }];
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    <span>Add Link Button</span>
                                                </button>
                                            </div>

                                            {project.links?.map((link, lIdx) => (
                                                <div key={lIdx} className="flex gap-2 items-center">
                                                    <select
                                                        value={link.type}
                                                        onChange={(e) => {
                                                            const copy = [...data.projects];
                                                            if (copy[idx].links) copy[idx].links![lIdx].type = e.target.value as ProjectLink["type"];
                                                            setData({ ...data, projects: copy });
                                                        }}
                                                        className="text-xs border border-slate-300 p-2 rounded-lg bg-white"
                                                    >
                                                        <option value="github">GitHub</option>
                                                        <option value="npm">NPM</option>
                                                        <option value="figma">Figma</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        value={link.label}
                                                        onChange={(e) => {
                                                            const copy = [...data.projects];
                                                            if (copy[idx].links) copy[idx].links![lIdx].label = e.target.value;
                                                            setData({ ...data, projects: copy });
                                                        }}
                                                        placeholder="Label"
                                                        className="text-xs border border-slate-300 p-2 rounded-lg bg-white w-1/3"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={link.href}
                                                        onChange={(e) => {
                                                            const copy = [...data.projects];
                                                            if (copy[idx].links) copy[idx].links![lIdx].href = e.target.value;
                                                            setData({ ...data, projects: copy });
                                                        }}
                                                        placeholder="https://..."
                                                        className="text-xs border border-slate-300 p-2 rounded-lg bg-white w-full font-mono"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const copy = [...data.projects];
                                                            copy[idx].links = copy[idx].links?.filter((_, i) => i !== lIdx);
                                                            setData({ ...data, projects: copy });
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* EXPERIENCES TAB */}
                    {activeTab === "experiences" && (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">Work & Leadership Experiences</h3>
                                    <p className="text-xs text-slate-500">Timeline of professional experience, founder roles and memberships</p>
                                </div>
                                <button
                                    onClick={() =>
                                        setData({
                                            ...data,
                                            experiences: [{ period: "2026 - Present", title: "New Role", organization: "Organization Name", current: true }, ...data.experiences],
                                        })
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Experience</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {data.experiences.map((exp, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entry #{idx + 1}</span>
                                            <button
                                                onClick={() => setData({ ...data, experiences: data.experiences.filter((_, i) => i !== idx) })}
                                                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <input
                                                type="text"
                                                value={exp.period}
                                                onChange={(e) => {
                                                    const copy = [...data.experiences];
                                                    copy[idx].period = e.target.value;
                                                    setData({ ...data, experiences: copy });
                                                }}
                                                placeholder="Period (e.g. 2025 - Present)"
                                                className="text-xs border border-slate-300 p-2 rounded-lg bg-white"
                                            />
                                            <input
                                                type="text"
                                                value={exp.title}
                                                onChange={(e) => {
                                                    const copy = [...data.experiences];
                                                    copy[idx].title = e.target.value;
                                                    setData({ ...data, experiences: copy });
                                                }}
                                                placeholder="Role / Title"
                                                className="text-xs border border-slate-300 p-2 rounded-lg bg-white"
                                            />
                                            <input
                                                type="text"
                                                value={exp.organization}
                                                onChange={(e) => {
                                                    const copy = [...data.experiences];
                                                    copy[idx].organization = e.target.value;
                                                    setData({ ...data, experiences: copy });
                                                }}
                                                placeholder="Company / Organization"
                                                className="text-xs border border-slate-300 p-2 rounded-lg bg-white"
                                            />
                                            <input
                                                type="text"
                                                value={exp.badge || ""}
                                                onChange={(e) => {
                                                    const copy = [...data.experiences];
                                                    copy[idx].badge = e.target.value || undefined;
                                                    setData({ ...data, experiences: copy });
                                                }}
                                                placeholder="Badge (e.g. Freelance)"
                                                className="text-xs border border-slate-300 p-2 rounded-lg bg-white"
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={exp.current}
                                                onChange={(e) => {
                                                    const copy = [...data.experiences];
                                                    copy[idx].current = e.target.checked;
                                                    setData({ ...data, experiences: copy });
                                                }}
                                                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                            />
                                            <span>Current / Ongoing Role (Blue Dot Indicator)</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* EDUCATIONS TAB */}
                    {activeTab === "educations" && (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">Education Timeline</h3>
                                    <p className="text-xs text-slate-500">Academic institutions and degree programs</p>
                                </div>
                                <button
                                    onClick={() =>
                                        setData({
                                            ...data,
                                            educations: [{ period: "2026 - Present", title: "Field of Study", organization: "Institution Name", current: true }, ...data.educations],
                                        })
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Education</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {data.educations.map((edu, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entry #{idx + 1}</span>
                                            <button
                                                onClick={() => setData({ ...data, educations: data.educations.filter((_, i) => i !== idx) })}
                                                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                value={edu.period}
                                                onChange={(e) => {
                                                    const copy = [...data.educations];
                                                    copy[idx].period = e.target.value;
                                                    setData({ ...data, educations: copy });
                                                }}
                                                placeholder="Period"
                                                className="text-xs border border-slate-300 p-2 rounded-lg bg-white"
                                            />
                                            <input
                                                type="text"
                                                value={edu.title}
                                                onChange={(e) => {
                                                    const copy = [...data.educations];
                                                    copy[idx].title = e.target.value;
                                                    setData({ ...data, educations: copy });
                                                }}
                                                placeholder="Major / Field of Study"
                                                className="text-xs border border-slate-300 p-2 rounded-lg bg-white"
                                            />
                                            <input
                                                type="text"
                                                value={edu.organization}
                                                onChange={(e) => {
                                                    const copy = [...data.educations];
                                                    copy[idx].organization = e.target.value;
                                                    setData({ ...data, educations: copy });
                                                }}
                                                placeholder="School / University"
                                                className="text-xs border border-slate-300 p-2 rounded-lg bg-white"
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={edu.current}
                                                onChange={(e) => {
                                                    const copy = [...data.educations];
                                                    copy[idx].current = e.target.checked;
                                                    setData({ ...data, educations: copy });
                                                }}
                                                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                            />
                                            <span>Currently Studying (Blue Dot Indicator)</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SKILLS TAB */}
                    {activeTab === "skills" && (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">Technical & Soft Skills</h3>
                                    <p className="text-xs text-slate-500">Group skills by categories (Tech Stack, Design, Tools, Soft Skills)</p>
                                </div>
                                <button
                                    onClick={() => setData({ ...data, skillGroups: [...data.skillGroups, { title: "New Category", items: ["Skill Item"] }] })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Category</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">
                                {data.skillGroups.map((group, sIdx) => (
                                    <div key={sIdx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <input
                                                type="text"
                                                value={group.title}
                                                onChange={(e) => {
                                                    const copy = [...data.skillGroups];
                                                    copy[sIdx].title = e.target.value;
                                                    setData({ ...data, skillGroups: copy });
                                                }}
                                                className="text-xs font-bold border border-slate-300 p-2 rounded-lg bg-white w-60"
                                            />
                                            <button
                                                onClick={() => setData({ ...data, skillGroups: data.skillGroups.filter((_, i) => i !== sIdx) })}
                                                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete Category</span>
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-slate-700">Skill Tags (Comma-separated)</label>
                                            <textarea
                                                rows={2}
                                                value={group.items.join(", ")}
                                                onChange={(e) => {
                                                    const copy = [...data.skillGroups];
                                                    copy[sIdx].items = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                                                    setData({ ...data, skillGroups: copy });
                                                }}
                                                className="w-full text-xs border border-slate-300 p-2.5 rounded-lg bg-white font-mono"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LANGUAGES TAB */}
                    {activeTab === "languages" && (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">Languages & Proficiency</h3>
                                    <p className="text-xs text-slate-500">Language fluency and visual progress bar percentages</p>
                                </div>
                                <button
                                    onClick={() => setData({ ...data, languages: [...data.languages, { name: "Language", level: "Proficiency Level", percent: 80 }] })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Language</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {data.languages.map((lang, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={lang.name}
                                            onChange={(e) => {
                                                const copy = [...data.languages];
                                                copy[idx].name = e.target.value;
                                                setData({ ...data, languages: copy });
                                            }}
                                            placeholder="Language Name"
                                            className="text-xs border border-slate-300 p-2.5 rounded-lg bg-white w-1/4"
                                        />
                                        <input
                                            type="text"
                                            value={lang.level}
                                            onChange={(e) => {
                                                const copy = [...data.languages];
                                                copy[idx].level = e.target.value;
                                                setData({ ...data, languages: copy });
                                            }}
                                            placeholder="Proficiency Level"
                                            className="text-xs border border-slate-300 p-2.5 rounded-lg bg-white w-1/2"
                                        />
                                        <div className="flex items-center gap-1 w-1/4">
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={lang.percent}
                                                onChange={(e) => {
                                                    const copy = [...data.languages];
                                                    copy[idx].percent = Number(e.target.value);
                                                    setData({ ...data, languages: copy });
                                                }}
                                                className="text-xs border border-slate-300 p-2.5 rounded-lg bg-white w-full"
                                            />
                                            <span className="text-xs font-semibold text-slate-500">%</span>
                                        </div>
                                        <button
                                            onClick={() => setData({ ...data, languages: data.languages.filter((_, i) => i !== idx) })}
                                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STATS TAB */}
                    {activeTab === "stats" && (
                        <div className="flex flex-col gap-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-base font-semibold text-slate-900">About Me Stat Cards</h3>
                                <p className="text-xs text-slate-500">Edit the three stat metrics shown under the About Me section</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {data.aboutStats.map((stat, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metric #{idx + 1}</span>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-slate-700">Display Value</label>
                                            <input
                                                type="text"
                                                value={stat.value}
                                                onChange={(e) => {
                                                    const copy = [...data.aboutStats];
                                                    copy[idx].value = e.target.value;
                                                    setData({ ...data, aboutStats: copy });
                                                }}
                                                placeholder="e.g. 19 or ~162 cm"
                                                className="text-xs font-semibold border border-slate-300 p-2.5 rounded-lg bg-white"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-slate-700">Subtext Label</label>
                                            <input
                                                type="text"
                                                value={stat.label}
                                                onChange={(e) => {
                                                    const copy = [...data.aboutStats];
                                                    copy[idx].label = e.target.value;
                                                    setData({ ...data, aboutStats: copy });
                                                }}
                                                placeholder="e.g. Years Old (in 2026)"
                                                className="text-xs border border-slate-300 p-2.5 rounded-lg bg-white"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
