"use client";

import { useEffect, useState } from "react";
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
        setStatus({ type: "success", message: "GitHub settings saved locally!" });
    };

    const handleDisconnect = () => {
        localStorage.removeItem("cms_github_token");
        setToken("");
        setIsConfigured(false);
        setStatus({ type: "idle", message: "" });
    };

    // --- Helper for UTF-8 Base64 Encoding ---
    const utf8ToBase64 = (str: string) => {
        return btoa(
            encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
                String.fromCharCode(parseInt(p1, 16))
            )
        );
    };

    // --- Helper to Upload Image to GitHub Repository ---
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

                // Check if file exists to get SHA
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
                setImageUploadStatus(`Uploaded! Saved to ${publicUrl}`);
            };
        } catch (err: unknown) {
            const error = err as Error;
            setImageUploadStatus(`Upload failed: ${error.message}`);
        }
    };

    // --- Save All Data to GitHub ---
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

            setStatus({ type: "loading", message: "Committing updated portfolio.json..." });

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
                message: "🎉 Committed successfully! GitHub Actions is deploying your update (~30-60s to live).",
            });
        } catch (err: unknown) {
            const error = err as Error;
            setStatus({ type: "error", message: error.message || "Failed to commit data" });
        }
    };

    return (
        <div className="min-h-screen bg-olive-50 text-taupe-950 p-4 md:p-8 font-sans">
            <div className="max-w-5xl mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-taupe-950/15 pb-4 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Portfolio CMS Dashboard</h1>
                        <p className="text-sm text-taupe-950/60">Git-based Headless Content Manager connected directly to GitHub</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href="/" className="px-4 py-2 text-sm border border-taupe-950/15 rounded-xl hover:bg-taupe-950/5">← Back to Portfolio</a>
                        <button
                            onClick={handleCommitToGitHub}
                            disabled={status.type === "loading"}
                            className="bg-[#5B8CFF] hover:bg-[#4878e6] text-white font-medium px-5 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
                        >
                            {status.type === "loading" ? "Publishing..." : "🚀 Save & Commit to GitHub"}
                        </button>
                    </div>
                </div>

                {/* Status Bar */}
                {status.message && (
                    <div className={`p-4 rounded-xl text-sm ${status.type === "error" ? "bg-red-100 text-red-700 border border-red-200" : status.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-blue-100 text-blue-800 border border-blue-200"}`}>
                        {status.message}
                    </div>
                )}

                {/* GitHub Config Section */}
                <div className="border border-taupe-950/15 p-5 rounded-2xl bg-white/50 backdrop-blur flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            🔑 GitHub Authentication
                            {isConfigured ? <span className="text-xs bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">Connected</span> : <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">Not Configured</span>}
                        </h2>
                        {isConfigured && (
                            <button onClick={handleDisconnect} className="text-xs text-red-600 hover:underline">Disconnect Token</button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium block mb-1">Target Repository (owner/repo)</label>
                            <input
                                type="text"
                                value={repo}
                                onChange={(e) => setRepo(e.target.value)}
                                className="w-full text-sm border border-taupe-950/15 p-2 rounded-lg bg-white"
                                placeholder="rpiirmdhni/rpiirmdhni.github.io"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">Personal Access Token (repo scope)</label>
                            <input
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full text-sm border border-taupe-950/15 p-2 rounded-lg bg-white"
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                            />
                        </div>
                    </div>
                    {!isConfigured && (
                        <button onClick={handleSaveConfig} className="w-fit px-4 py-1.5 text-xs bg-taupe-950 text-white rounded-lg hover:bg-taupe-950/80">Save Token to Browser</button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-taupe-950/15 overflow-x-auto gap-2">
                    {(["projects", "experiences", "educations", "skills", "languages", "stats"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition-all whitespace-nowrap ${activeTab === tab ? "border-[#5B8CFF] text-[#5B8CFF]" : "border-transparent text-taupe-950/60 hover:text-taupe-950"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* TAB CONTENT */}
                <div className="border border-taupe-950/15 p-6 rounded-2xl bg-white flex flex-col gap-6">
                    {/* PROJECTS TAB */}
                    {activeTab === "projects" && (
                        <div className="flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold">Projects ({data.projects.length})</h3>
                                <button
                                    onClick={() => setData({ ...data, projects: [{ title: "New Project", image: "/assets/img/projects/litespeak.png", description: "Project description", badge: "", links: [] }, ...data.projects] })}
                                    className="px-3 py-1.5 text-xs bg-[#5B8CFF] text-white rounded-lg font-medium"
                                >
                                    + Add Project
                                </button>
                            </div>

                            {imageUploadStatus && <p className="text-xs text-blue-600 font-mono">{imageUploadStatus}</p>}

                            <div className="flex flex-col gap-6">
                                {data.projects.map((project, idx) => (
                                    <div key={idx} className="border border-taupe-950/15 p-4 rounded-xl flex flex-col gap-4 bg-olive-50/50">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-taupe-950/50">Project #{idx + 1}</span>
                                            <button
                                                onClick={() => setData({ ...data, projects: data.projects.filter((_, i) => i !== idx) })}
                                                className="text-xs text-red-600 hover:underline"
                                            >
                                                Delete Project
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-medium block mb-1">Title</label>
                                                <input
                                                    type="text"
                                                    value={project.title}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].title = e.target.value;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="w-full text-sm border border-taupe-950/15 p-2 rounded-lg bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium block mb-1">Badge (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={project.badge || ""}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].badge = e.target.value || undefined;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="w-full text-sm border border-taupe-950/15 p-2 rounded-lg bg-white"
                                                    placeholder="e.g. Private"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium block mb-1">Image URL / Path</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    value={project.image}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].image = e.target.value;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="w-full text-sm border border-taupe-950/15 p-2 rounded-lg bg-white"
                                                />
                                                <label className="cursor-pointer px-3 py-2 text-xs bg-taupe-950 text-white rounded-lg whitespace-nowrap hover:bg-taupe-950/80">
                                                    Upload File
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

                                        <div>
                                            <label className="text-xs font-medium block mb-1">Description</label>
                                            <textarea
                                                rows={2}
                                                value={project.description}
                                                onChange={(e) => {
                                                    const copy = [...data.projects];
                                                    copy[idx].description = e.target.value;
                                                    setData({ ...data, projects: copy });
                                                }}
                                                className="w-full text-sm border border-taupe-950/15 p-2 rounded-lg bg-white"
                                            />
                                        </div>

                                        {/* Links */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-semibold">Links</label>
                                                <button
                                                    onClick={() => {
                                                        const copy = [...data.projects];
                                                        copy[idx].links = [...(copy[idx].links || []), { type: "github", href: "", label: "View link" }];
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="text-xs text-[#5B8CFF] font-medium"
                                                >
                                                    + Add Link
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
                                                        className="text-xs border border-taupe-950/15 p-2 rounded-lg bg-white"
                                                    >
                                                        <option value="github">github</option>
                                                        <option value="npm">npm</option>
                                                        <option value="figma">figma</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        value={link.label}
                                                        onChange={(e) => {
                                                            const copy = [...data.projects];
                                                            if (copy[idx].links) copy[idx].links![lIdx].label = e.target.value;
                                                            setData({ ...data, projects: copy });
                                                        }}
                                                        placeholder="Label (e.g. View on Github)"
                                                        className="text-xs border border-taupe-950/15 p-2 rounded-lg bg-white w-1/3"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={link.href}
                                                        onChange={(e) => {
                                                            const copy = [...data.projects];
                                                            if (copy[idx].links) copy[idx].links![lIdx].href = e.target.value;
                                                            setData({ ...data, projects: copy });
                                                        }}
                                                        placeholder="URL (https://...)"
                                                        className="text-xs border border-taupe-950/15 p-2 rounded-lg bg-white w-full"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const copy = [...data.projects];
                                                            copy[idx].links = copy[idx].links?.filter((_, i) => i !== lIdx);
                                                            setData({ ...data, projects: copy });
                                                        }}
                                                        className="text-xs text-red-500 font-bold px-2"
                                                    >
                                                        ✕
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
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold">Experiences ({data.experiences.length})</h3>
                                <button
                                    onClick={() => setData({ ...data, experiences: [{ period: "2026 - Present", title: "New Role", organization: "Company Name", current: true }, ...data.experiences] })}
                                    className="px-3 py-1.5 text-xs bg-[#5B8CFF] text-white rounded-lg font-medium"
                                >
                                    + Add Experience
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {data.experiences.map((exp, idx) => (
                                    <div key={idx} className="border border-taupe-950/15 p-4 rounded-xl flex flex-col gap-3 bg-olive-50/50">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-taupe-950/50">Entry #{idx + 1}</span>
                                            <button
                                                onClick={() => setData({ ...data, experiences: data.experiences.filter((_, i) => i !== idx) })}
                                                className="text-xs text-red-600 hover:underline"
                                            >
                                                Delete
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
                                                className="text-xs border border-taupe-950/15 p-2 rounded-lg bg-white"
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
                                                className="text-xs border border-taupe-950/15 p-2 rounded-lg bg-white"
                                            />
                                            <input
                                                type="text"
                                                value={exp.organization}
                                                onChange={(e) => {
                                                    const copy = [...data.experiences];
                                                    copy[idx].organization = e.target.value;
                                                    setData({ ...data, experiences: copy });
                                                }}
                                                placeholder="Organization / Company"
                                                className="text-xs border border-taupe-950/15 p-2 rounded-lg bg-white"
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
                                                className="text-xs border border-taupe-950/15 p-2 rounded-lg bg-white"
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={exp.current}
                                                onChange={(e) => {
                                                    const copy = [...data.experiences];
                                                    copy[idx].current = e.target.checked;
                                                    setData({ ...data, experiences: copy });
                                                }}
                                            />
                                            <span>Ongoing / Current role (Filled Blue Dot)</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* EDUCATIONS TAB */}
                    {activeTab === "educations" && (
                        <div className="flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold">Educations ({data.educations.length})</h3>
                                <button
                                    onClick={() => setData({ ...data, educations: [{ period: "2026 - Present", title: "Degree / Program", organization: "Institution Name", current: true }, ...data.educations] })}
                                    className="px-3 py-1.5 text-xs bg-[#5B8CFF] text-white rounded-lg font-medium"
                                >
                                    + Add Education
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {data.educations.map((edu, idx) => (
                                    <div key={idx} className="border border-taupe-950/15 p-4 rounded-xl flex flex-col gap-3 bg-olive-50/50">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-taupe-950/50">Entry #{idx + 1}</span>
                                            <button
                                                onClick={() => setData({ ...data, educations: data.educations.filter((_, i) => i !== idx) })}
                                                className="text-xs text-red-600 hover:underline"
                                            >
                                                Delete
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
                                                className="text-xs border border-taupe-950/15 p-2 rounded-lg bg-white"
                                            />
                                            <input
                                                type="text"
                                                value={edu.title}
                                                onChange={(e) => {
                                                    const copy = [...data.educations];
                                                    copy[idx].title = e.target.value;
                                                    setData({ ...data, educations: copy });
                                                }}
                                                placeholder="Field of Study"
                                                className="text-xs border border-taupe-950/15 p-2 rounded-lg bg-white"
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
                                                className="text-xs border border-taupe-950/15 p-2 rounded-lg bg-white"
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={edu.current}
                                                onChange={(e) => {
                                                    const copy = [...data.educations];
                                                    copy[idx].current = e.target.checked;
                                                    setData({ ...data, educations: copy });
                                                }}
                                            />
                                            <span>Currently Studying (Filled Blue Dot)</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SKILLS TAB */}
                    {activeTab === "skills" && (
                        <div className="flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold">Skill Groups ({data.skillGroups.length})</h3>
                                <button
                                    onClick={() => setData({ ...data, skillGroups: [...data.skillGroups, { title: "New Category", items: ["Skill Item"] }] })}
                                    className="px-3 py-1.5 text-xs bg-[#5B8CFF] text-white rounded-lg font-medium"
                                >
                                    + Add Category
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">
                                {data.skillGroups.map((group, sIdx) => (
                                    <div key={sIdx} className="border border-taupe-950/15 p-4 rounded-xl flex flex-col gap-3 bg-olive-50/50">
                                        <div className="flex justify-between items-center">
                                            <input
                                                type="text"
                                                value={group.title}
                                                onChange={(e) => {
                                                    const copy = [...data.skillGroups];
                                                    copy[sIdx].title = e.target.value;
                                                    setData({ ...data, skillGroups: copy });
                                                }}
                                                className="text-sm font-bold border border-taupe-950/15 p-1.5 rounded-lg bg-white w-60"
                                            />
                                            <button
                                                onClick={() => setData({ ...data, skillGroups: data.skillGroups.filter((_, i) => i !== sIdx) })}
                                                className="text-xs text-red-600 hover:underline"
                                            >
                                                Delete Category
                                            </button>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium block mb-1">Items (comma-separated)</label>
                                            <textarea
                                                rows={2}
                                                value={group.items.join(", ")}
                                                onChange={(e) => {
                                                    const copy = [...data.skillGroups];
                                                    copy[sIdx].items = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                                                    setData({ ...data, skillGroups: copy });
                                                }}
                                                className="w-full text-xs border border-taupe-950/15 p-2 rounded-lg bg-white font-mono"
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
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold">Languages ({data.languages.length})</h3>
                                <button
                                    onClick={() => setData({ ...data, languages: [...data.languages, { name: "Language", level: "Proficiency Level", percent: 50 }] })}
                                    className="px-3 py-1.5 text-xs bg-[#5B8CFF] text-white rounded-lg font-medium"
                                >
                                    + Add Language
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {data.languages.map((lang, idx) => (
                                    <div key={idx} className="border border-taupe-950/15 p-4 rounded-xl flex items-center gap-3 bg-olive-50/50">
                                        <input
                                            type="text"
                                            value={lang.name}
                                            onChange={(e) => {
                                                const copy = [...data.languages];
                                                copy[idx].name = e.target.value;
                                                setData({ ...data, languages: copy });
                                            }}
                                            placeholder="Language Name"
                                            className="text-xs border border-taupe-950/15 p-2 rounded-lg bg-white w-1/4"
                                        />
                                        <input
                                            type="text"
                                            value={lang.level}
                                            onChange={(e) => {
                                                const copy = [...data.languages];
                                                copy[idx].level = e.target.value;
                                                setData({ ...data, languages: copy });
                                            }}
                                            placeholder="Proficiency Description"
                                            className="text-xs border border-taupe-950/15 p-2 rounded-lg bg-white w-1/2"
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
                                                className="text-xs border border-taupe-950/15 p-2 rounded-lg bg-white w-full"
                                            />
                                            <span className="text-xs">%</span>
                                        </div>
                                        <button
                                            onClick={() => setData({ ...data, languages: data.languages.filter((_, i) => i !== idx) })}
                                            className="text-xs text-red-600 font-bold px-2"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STATS TAB */}
                    {activeTab === "stats" && (
                        <div className="flex flex-col gap-6">
                            <h3 className="text-xl font-semibold">About Me Stats</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {data.aboutStats.map((stat, idx) => (
                                    <div key={idx} className="border border-taupe-950/15 p-4 rounded-xl flex flex-col gap-2 bg-olive-50/50">
                                        <label className="text-xs font-semibold">Card #{idx + 1}</label>
                                        <input
                                            type="text"
                                            value={stat.value}
                                            onChange={(e) => {
                                                const copy = [...data.aboutStats];
                                                copy[idx].value = e.target.value;
                                                setData({ ...data, aboutStats: copy });
                                            }}
                                            placeholder="Value (e.g. 19 or ~162 cm)"
                                            className="text-sm font-bold border border-taupe-950/15 p-2 rounded-lg bg-white"
                                        />
                                        <input
                                            type="text"
                                            value={stat.label}
                                            onChange={(e) => {
                                                const copy = [...data.aboutStats];
                                                copy[idx].label = e.target.value;
                                                setData({ ...data, aboutStats: copy });
                                            }}
                                            placeholder="Label (e.g. Years Old)"
                                            className="text-xs border border-taupe-950/15 p-2 rounded-lg bg-white"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
