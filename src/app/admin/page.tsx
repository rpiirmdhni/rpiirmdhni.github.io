"use client";

import { useEffect, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    BarChart3,
    Briefcase,
    CheckCircle2,
    ExternalLink,
    FolderKanban,
    Globe,
    GraduationCap,
    Key,
    LayoutDashboard,
    Loader2,
    Lock,
    LogOut,
    Plus,
    RefreshCw,
    Save,
    Settings,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    Upload,
    UserCheck,
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

export default function AdminDashboard() {
    const [token, setToken] = useState("");
    const [repo, setRepo] = useState("rpiirmdhni/rpiirmdhni.github.io");
    const [data, setData] = useState<PortfolioData>(initialPortfolioData as PortfolioData);
    const [activeTab, setActiveTab] = useState<"overview" | "projects" | "experiences" | "educations" | "skills" | "languages" | "stats" | "settings">("overview");

    const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; message: string }>({ type: "idle", message: "" });
    const [imageUploadStatus, setImageUploadStatus] = useState<string>("");

    const [tokenValidation, setTokenValidation] = useState<{
        status: "idle" | "testing" | "valid" | "invalid";
        message: string;
        userLogin?: string;
        canPush?: boolean;
    }>({ status: "idle", message: "" });

    // Load credentials on mount and run validation
    useEffect(() => {
        const savedToken = localStorage.getItem("cms_github_token") || "";
        const savedRepo = localStorage.getItem("cms_github_repo") || "rpiirmdhni/rpiirmdhni.github.io";

        if (savedToken) {
            setToken(savedToken);
            setRepo(savedRepo);
            validateToken(savedToken, savedRepo);
        }
    }, []);

    // Real-time API Key / Token Validation
    const validateToken = async (testToken: string, testRepo: string) => {
        if (!testToken.trim()) {
            setTokenValidation({ status: "invalid", message: "Token is empty. Please enter your GitHub Personal Access Token.", canPush: false });
            return false;
        }

        setTokenValidation({ status: "testing", message: "Validating token & push permissions via GitHub API..." });

        try {
            const res = await fetch(`https://api.github.com/repos/${testRepo.trim()}`, {
                headers: { Authorization: `Bearer ${testToken.trim()}` },
            });

            if (res.status === 401) {
                setTokenValidation({
                    status: "invalid",
                    message: "Invalid Token: Token expired or failed authentication (HTTP 401 Unauthorized).",
                    canPush: false,
                });
                return false;
            }

            if (res.status === 404) {
                setTokenValidation({
                    status: "invalid",
                    message: `Repository "${testRepo}" not found or token lacks repository read permission (HTTP 404).`,
                    canPush: false,
                });
                return false;
            }

            if (!res.ok) {
                const err = await res.json();
                setTokenValidation({
                    status: "invalid",
                    message: `Validation Error: ${err.message || res.statusText}`,
                    canPush: false,
                });
                return false;
            }

            const repoData = await res.json();
            const canPush = repoData.permissions?.push === true || repoData.permissions?.admin === true;

            if (!canPush) {
                setTokenValidation({
                    status: "invalid",
                    message: `Token valid for reading, but lacks WRITE / PUSH permissions for ${testRepo}.`,
                    canPush: false,
                    userLogin: repoData.owner?.login,
                });
                return false;
            }

            setTokenValidation({
                status: "valid",
                message: `Token Validated! Write & Push permissions confirmed for ${testRepo} (@${repoData.owner?.login}).`,
                userLogin: repoData.owner?.login,
                canPush: true,
            });
            return true;
        } catch (err: unknown) {
            const error = err as Error;
            setTokenValidation({
                status: "invalid",
                message: `Connection Error: ${error.message}`,
                canPush: false,
            });
            return false;
        }
    };

    const handleSaveConfig = async () => {
        if (!token.trim()) return alert("Please enter your GitHub Personal Access Token");
        localStorage.setItem("cms_github_token", token.trim());
        localStorage.setItem("cms_github_repo", repo.trim());
        await validateToken(token, repo);
    };

    const handleDisconnect = () => {
        localStorage.removeItem("cms_github_token");
        setToken("");
        setTokenValidation({ status: "idle", message: "" });
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
        if (!token) return alert("Please configure and validate your GitHub Token first.");
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
                setImageUploadStatus(`Uploaded! Saved to ${publicUrl}`);
            };
        } catch (err: unknown) {
            const error = err as Error;
            setImageUploadStatus(`Upload failed: ${error.message}`);
        }
    };

    const handleCommitToGitHub = async () => {
        if (!token || tokenValidation.status !== "valid") {
            const isValid = await validateToken(token, repo);
            if (!isValid) return alert("Please configure a valid GitHub token with push access before committing.");
        }

        setStatus({ type: "loading", message: "Fetching latest SHA from GitHub..." });

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

            setStatus({ type: "loading", message: "Committing portfolio.json to GitHub..." });

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
                message: "Pushed successfully! GitHub Actions is building and deploying your update (~30-60s to live).",
            });
        } catch (err: unknown) {
            const error = err as Error;
            setStatus({ type: "error", message: error.message || "Failed to commit data" });
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col md:flex-row">
            {/* LEFT SIDEBAR (SHADCN DASHBOARD SIDEBAR) */}
            <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
                <div className="flex flex-col">
                    {/* Brand Header */}
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                                RR
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm text-slate-100 tracking-tight">Rafie CMS</span>
                                <span className="text-[10px] text-slate-400 font-mono">v1.0 • shadcn ui</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="p-3 flex flex-col gap-1">
                        {[
                            { id: "overview", label: "Overview", icon: LayoutDashboard },
                            { id: "projects", label: "Projects", icon: FolderKanban, badge: data.projects.length },
                            { id: "experiences", label: "Experiences", icon: Briefcase, badge: data.experiences.length },
                            { id: "educations", label: "Educations", icon: GraduationCap, badge: data.educations.length },
                            { id: "skills", label: "Skills", icon: Wrench, badge: data.skillGroups.length },
                            { id: "languages", label: "Languages", icon: Globe, badge: data.languages.length },
                            { id: "stats", label: "About Stats", icon: BarChart3 },
                            { id: "settings", label: "API & Security", icon: Settings },
                        ].map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as typeof activeTab)}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive
                                            ? "bg-blue-600 text-white font-semibold shadow-xs"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </div>
                                    {item.badge !== undefined && (
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-blue-700 text-white" : "bg-slate-800 text-slate-400"}`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Footer Info */}
                <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-850 rounded-lg border border-slate-800">
                        {tokenValidation.status === "valid" ? (
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        )}
                        <span className="text-[11px] text-slate-300 font-mono truncate">
                            {tokenValidation.status === "valid" ? `@${tokenValidation.userLogin || "authenticated"}` : "Not Connected"}
                        </span>
                    </div>

                    <a
                        href="/"
                        target="_blank"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Live Portfolio</span>
                    </a>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
                {/* TOP HEADER BAR */}
                <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Dashboard</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-xs text-slate-200 font-semibold capitalize">{activeTab}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Token Validation Pill */}
                        {tokenValidation.status === "valid" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-950/60 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full font-medium">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>API Key Validated</span>
                            </span>
                        ) : (
                            <button
                                onClick={() => setActiveTab("settings")}
                                className="inline-flex items-center gap-1.5 text-xs bg-red-950/60 text-red-400 border border-red-800 px-3 py-1 rounded-full font-medium hover:bg-red-900/40"
                            >
                                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                                <span>Configure API Key</span>
                            </button>
                        )}

                        <button
                            onClick={handleCommitToGitHub}
                            disabled={status.type === "loading"}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                            {status.type === "loading" ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Committing...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save & Commit to GitHub</span>
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {/* MAIN BODY DASHBOARD */}
                <main className="p-6 flex flex-col gap-6 max-w-6xl w-full mx-auto">
                    {/* Status Alert Banner */}
                    {status.message && (
                        <div
                            className={`flex items-center justify-between p-4 rounded-xl text-xs font-medium border shadow-xs ${status.type === "error"
                                    ? "bg-red-950/80 text-red-200 border-red-800"
                                    : status.type === "success"
                                        ? "bg-emerald-950/80 text-emerald-200 border-emerald-800"
                                        : "bg-blue-950/80 text-blue-200 border-blue-800"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {status.type === "error" && <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
                                {status.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
                                {status.type === "loading" && <Loader2 className="w-4 h-4 shrink-0 animate-spin text-blue-400" />}
                                <span>{status.message}</span>
                            </div>
                            <button onClick={() => setStatus({ type: "idle", message: "" })} className="text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* OVERVIEW SCREEN */}
                    {activeTab === "overview" && (
                        <div className="flex flex-col gap-6">
                            {/* Security Notice Card */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-blue-950 border border-blue-800 text-blue-400 rounded-lg shrink-0">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-sm font-semibold text-slate-100">🔒 Privacy & Access Control</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                                            Your Personal Access Token is stored <strong>exclusively in your local browser storage</strong> (`localStorage`).
                                            No unauthorized users can commit changes to your repository because only your local browser holds your secret API key.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => validateToken(token, repo)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Check Permissions</span>
                                </button>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Total Projects", value: data.projects.length, sub: "Showcased items", icon: FolderKanban, tab: "projects" },
                                    { label: "Experiences", value: data.experiences.length, sub: "Work & leadership", icon: Briefcase, tab: "experiences" },
                                    { label: "Skill Groups", value: data.skillGroups.length, sub: `${data.skillGroups.reduce((a, b) => a + b.items.length, 0)} total tags`, icon: Wrench, tab: "skills" },
                                    { label: "Languages", value: data.languages.length, sub: "Proficiency ratings", icon: Globe, tab: "languages" },
                                ].map((card, i) => {
                                    const Icon = card.icon;
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => setActiveTab(card.tab as typeof activeTab)}
                                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-xl flex flex-col gap-3 cursor-pointer transition-all hover:translate-y-[-2px]"
                                        >
                                            <div className="flex justify-between items-center text-slate-400">
                                                <span className="text-xs font-medium">{card.label}</span>
                                                <Icon className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-bold text-slate-100">{card.value}</span>
                                                <span className="text-[11px] text-slate-400">{card.sub}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Quick Overview Table */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                    <h3 className="text-sm font-semibold text-slate-100">Live Featured Projects Overview</h3>
                                    <button onClick={() => setActiveTab("projects")} className="text-xs text-blue-400 hover:underline">Manage All</button>
                                </div>
                                <div className="divide-y divide-slate-800">
                                    {data.projects.map((proj, idx) => (
                                        <div key={idx} className="py-3 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-500 font-mono">#{idx + 1}</span>
                                                <span className="font-semibold text-slate-200">{proj.title}</span>
                                                {proj.badge && <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">{proj.badge}</span>}
                                            </div>
                                            <span className="text-slate-400 font-mono truncate max-w-xs">{proj.image}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* API SETTINGS & VALIDATION TAB */}
                    {activeTab === "settings" && (
                        <div className="flex flex-col gap-6 max-w-3xl">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-5">
                                <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-100">GitHub API Credentials & Validation</h3>
                                        <p className="text-xs text-slate-400">Configure your Personal Access Token (PAT) and validate push access</p>
                                    </div>
                                    {tokenValidation.status === "valid" ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full font-medium">
                                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Access Granted</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-xs bg-red-950 text-red-400 border border-red-800 px-3 py-1 rounded-full font-medium">
                                            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                                            <span>Validation Required</span>
                                        </span>
                                    )}
                                </div>

                                {/* Validation Output Alert Box */}
                                {tokenValidation.message && (
                                    <div
                                        className={`p-4 rounded-lg text-xs font-mono border flex items-start gap-2.5 ${tokenValidation.status === "valid"
                                                ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                                                : tokenValidation.status === "testing"
                                                    ? "bg-blue-950/60 border-blue-800 text-blue-300"
                                                    : "bg-red-950/60 border-red-800 text-red-300"
                                            }`}
                                    >
                                        {tokenValidation.status === "testing" && <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-400" />}
                                        {tokenValidation.status === "valid" && <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />}
                                        {tokenValidation.status === "invalid" && <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />}
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold">Validation Result:</span>
                                            <span>{tokenValidation.message}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium text-slate-300">Target Repository (owner/repo)</label>
                                        <input
                                            type="text"
                                            value={repo}
                                            onChange={(e) => setRepo(e.target.value)}
                                            className="w-full text-xs border border-slate-700 p-2.5 rounded-lg bg-slate-950 text-slate-100 focus:outline-hidden focus:border-blue-500 font-mono"
                                            placeholder="rpiirmdhni/rpiirmdhni.github.io"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium text-slate-300">Personal Access Token (PAT)</label>
                                        <input
                                            type="password"
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                            className="w-full text-xs border border-slate-700 p-2.5 rounded-lg bg-slate-950 text-slate-100 focus:outline-hidden focus:border-blue-500 font-mono"
                                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                        />
                                        <span className="text-[11px] text-slate-500">
                                            Token requires `contents: write` or `repo` scope permissions.
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={handleSaveConfig}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                    >
                                        <Key className="w-3.5 h-3.5" />
                                        <span>Save & Test Token</span>
                                    </button>

                                    {token && (
                                        <button
                                            onClick={handleDisconnect}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            <span>Clear Saved Credentials</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PROJECTS TAB */}
                    {activeTab === "projects" && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-100">Featured Projects ({data.projects.length})</h3>
                                    <p className="text-xs text-slate-400">Manage showcase cards, upload images, and configure link actions</p>
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
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Project</span>
                                </button>
                            </div>

                            {imageUploadStatus && (
                                <div className="text-xs text-blue-300 bg-blue-950/80 border border-blue-800 p-3 rounded-lg font-mono flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-blue-400" />
                                    <span>{imageUploadStatus}</span>
                                </div>
                            )}

                            <div className="flex flex-col gap-6">
                                {data.projects.map((project, idx) => (
                                    <div key={idx} className="border border-slate-800 rounded-xl p-5 bg-slate-950/60 flex flex-col gap-4">
                                        <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                                            <span className="text-xs font-mono font-bold text-slate-500">PROJECT #{idx + 1}</span>
                                            <button
                                                onClick={() => setData({ ...data, projects: data.projects.filter((_, i) => i !== idx) })}
                                                className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-medium text-slate-300">Project Title</label>
                                                <input
                                                    type="text"
                                                    value={project.title}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].title = e.target.value;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="w-full text-xs border border-slate-700 p-2.5 rounded-lg bg-slate-900 text-slate-100"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-medium text-slate-300">Badge Tag (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={project.badge || ""}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].badge = e.target.value || undefined;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="w-full text-xs border border-slate-700 p-2.5 rounded-lg bg-slate-900 text-slate-100"
                                                    placeholder="e.g. Private"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-slate-300">Image Asset Path / Upload</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    value={project.image}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].image = e.target.value;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="w-full text-xs border border-slate-700 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono"
                                                />
                                                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors whitespace-nowrap">
                                                    <Upload className="w-3.5 h-3.5" />
                                                    <span>Upload File</span>
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

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-slate-300">Description</label>
                                            <textarea
                                                rows={2}
                                                value={project.description}
                                                onChange={(e) => {
                                                    const copy = [...data.projects];
                                                    copy[idx].description = e.target.value;
                                                    setData({ ...data, projects: copy });
                                                }}
                                                className="w-full text-xs border border-slate-700 p-2.5 rounded-lg bg-slate-900 text-slate-100"
                                            />
                                        </div>

                                        {/* Links */}
                                        <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-semibold text-slate-300">Action Button Links</label>
                                                <button
                                                    onClick={() => {
                                                        const copy = [...data.projects];
                                                        copy[idx].links = [...(copy[idx].links || []), { type: "github", href: "", label: "View Link" }];
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs text-blue-400 font-medium hover:underline"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>Add Link</span>
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
                                                        className="text-xs border border-slate-700 p-2 rounded-lg bg-slate-900 text-slate-100"
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
                                                        placeholder="Button Label"
                                                        className="text-xs border border-slate-700 p-2 rounded-lg bg-slate-900 text-slate-100 w-1/3"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={link.href}
                                                        onChange={(e) => {
                                                            const copy = [...data.projects];
                                                            if (copy[idx].links) copy[idx].links![lIdx].href = e.target.value;
                                                            setData({ ...data, projects: copy });
                                                        }}
                                                        placeholder="URL"
                                                        className="text-xs border border-slate-700 p-2 rounded-lg bg-slate-900 text-slate-100 w-full font-mono"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const copy = [...data.projects];
                                                            copy[idx].links = copy[idx].links?.filter((_, i) => i !== lIdx);
                                                            setData({ ...data, projects: copy });
                                                        }}
                                                        className="p-1.5 text-slate-500 hover:text-red-400"
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
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-100">Work & Leadership Experiences</h3>
                                    <p className="text-xs text-slate-400">Timeline of professional experience, founder roles and memberships</p>
                                </div>
                                <button
                                    onClick={() =>
                                        setData({
                                            ...data,
                                            experiences: [{ period: "2026 - Present", title: "New Role", organization: "Organization Name", current: true }, ...data.experiences],
                                        })
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Experience</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {data.experiences.map((exp, idx) => (
                                    <div key={idx} className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-mono font-bold text-slate-500">ENTRY #{idx + 1}</span>
                                            <button
                                                onClick={() => setData({ ...data, experiences: data.experiences.filter((_, i) => i !== idx) })}
                                                className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium"
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
                                                placeholder="Period"
                                                className="text-xs border border-slate-700 p-2 rounded-lg bg-slate-900 text-slate-100"
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
                                                className="text-xs border border-slate-700 p-2 rounded-lg bg-slate-900 text-slate-100"
                                            />
                                            <input
                                                type="text"
                                                value={exp.organization}
                                                onChange={(e) => {
                                                    const copy = [...data.experiences];
                                                    copy[idx].organization = e.target.value;
                                                    setData({ ...data, experiences: copy });
                                                }}
                                                placeholder="Organization"
                                                className="text-xs border border-slate-700 p-2 rounded-lg bg-slate-900 text-slate-100"
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
                                                className="text-xs border border-slate-700 p-2 rounded-lg bg-slate-900 text-slate-100"
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={exp.current}
                                                onChange={(e) => {
                                                    const copy = [...data.experiences];
                                                    copy[idx].current = e.target.checked;
                                                    setData({ ...data, experiences: copy });
                                                }}
                                                className="rounded border-slate-700 bg-slate-900 text-blue-600"
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
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-100">Education Timeline</h3>
                                    <p className="text-xs text-slate-400">Academic institutions and degree programs</p>
                                </div>
                                <button
                                    onClick={() =>
                                        setData({
                                            ...data,
                                            educations: [{ period: "2026 - Present", title: "Field of Study", organization: "Institution Name", current: true }, ...data.educations],
                                        })
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Education</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {data.educations.map((edu, idx) => (
                                    <div key={idx} className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-mono font-bold text-slate-500">ENTRY #{idx + 1}</span>
                                            <button
                                                onClick={() => setData({ ...data, educations: data.educations.filter((_, i) => i !== idx) })}
                                                className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium"
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
                                                className="text-xs border border-slate-700 p-2 rounded-lg bg-slate-900 text-slate-100"
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
                                                className="text-xs border border-slate-700 p-2 rounded-lg bg-slate-900 text-slate-100"
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
                                                className="text-xs border border-slate-700 p-2 rounded-lg bg-slate-900 text-slate-100"
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={edu.current}
                                                onChange={(e) => {
                                                    const copy = [...data.educations];
                                                    copy[idx].current = e.target.checked;
                                                    setData({ ...data, educations: copy });
                                                }}
                                                className="rounded border-slate-700 bg-slate-900 text-blue-600"
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
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-100">Technical & Soft Skill Categories</h3>
                                    <p className="text-xs text-slate-400">Group skills by category title and comma-separated tags</p>
                                </div>
                                <button
                                    onClick={() => setData({ ...data, skillGroups: [...data.skillGroups, { title: "New Category", items: ["Skill Item"] }] })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Category</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">
                                {data.skillGroups.map((group, sIdx) => (
                                    <div key={sIdx} className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <input
                                                type="text"
                                                value={group.title}
                                                onChange={(e) => {
                                                    const copy = [...data.skillGroups];
                                                    copy[sIdx].title = e.target.value;
                                                    setData({ ...data, skillGroups: copy });
                                                }}
                                                className="text-xs font-bold border border-slate-700 p-2 rounded-lg bg-slate-900 text-slate-100 w-60"
                                            />
                                            <button
                                                onClick={() => setData({ ...data, skillGroups: data.skillGroups.filter((_, i) => i !== sIdx) })}
                                                className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete Category</span>
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-slate-400">Items (comma-separated)</label>
                                            <textarea
                                                rows={2}
                                                value={group.items.join(", ")}
                                                onChange={(e) => {
                                                    const copy = [...data.skillGroups];
                                                    copy[sIdx].items = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                                                    setData({ ...data, skillGroups: copy });
                                                }}
                                                className="w-full text-xs border border-slate-700 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LANGUAGES TAB */}
                    {activeTab === "languages" && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-100">Languages & Fluency</h3>
                                    <p className="text-xs text-slate-400">Language ratings and progress bar percentages</p>
                                </div>
                                <button
                                    onClick={() => setData({ ...data, languages: [...data.languages, { name: "Language", level: "Proficiency Level", percent: 80 }] })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Language</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {data.languages.map((lang, idx) => (
                                    <div key={idx} className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={lang.name}
                                            onChange={(e) => {
                                                const copy = [...data.languages];
                                                copy[idx].name = e.target.value;
                                                setData({ ...data, languages: copy });
                                            }}
                                            placeholder="Language"
                                            className="text-xs border border-slate-700 p-2.5 rounded-lg bg-slate-900 text-slate-100 w-1/4"
                                        />
                                        <input
                                            type="text"
                                            value={lang.level}
                                            onChange={(e) => {
                                                const copy = [...data.languages];
                                                copy[idx].level = e.target.value;
                                                setData({ ...data, languages: copy });
                                            }}
                                            placeholder="Level Description"
                                            className="text-xs border border-slate-700 p-2.5 rounded-lg bg-slate-900 text-slate-100 w-1/2"
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
                                                className="text-xs border border-slate-700 p-2.5 rounded-lg bg-slate-900 text-slate-100 w-full font-mono"
                                            />
                                            <span className="text-xs font-semibold text-slate-500">%</span>
                                        </div>
                                        <button
                                            onClick={() => setData({ ...data, languages: data.languages.filter((_, i) => i !== idx) })}
                                            className="p-1.5 text-slate-500 hover:text-red-400"
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
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
                            <div className="border-b border-slate-800 pb-4">
                                <h3 className="text-sm font-semibold text-slate-100">About Me Stat Cards</h3>
                                <p className="text-xs text-slate-400">Edit values and labels for the three main stats cards</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {data.aboutStats.map((stat, idx) => (
                                    <div key={idx} className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 flex flex-col gap-3">
                                        <span className="text-xs font-mono font-bold text-slate-500">METRIC #{idx + 1}</span>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-slate-300">Display Value</label>
                                            <input
                                                type="text"
                                                value={stat.value}
                                                onChange={(e) => {
                                                    const copy = [...data.aboutStats];
                                                    copy[idx].value = e.target.value;
                                                    setData({ ...data, aboutStats: copy });
                                                }}
                                                placeholder="e.g. 19"
                                                className="text-xs font-bold border border-slate-700 p-2.5 rounded-lg bg-slate-900 text-slate-100"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-slate-300">Label Subtext</label>
                                            <input
                                                type="text"
                                                value={stat.label}
                                                onChange={(e) => {
                                                    const copy = [...data.aboutStats];
                                                    copy[idx].label = e.target.value;
                                                    setData({ ...data, aboutStats: copy });
                                                }}
                                                placeholder="e.g. Years Old"
                                                className="text-xs border border-slate-700 p-2.5 rounded-lg bg-slate-900 text-slate-100"
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
