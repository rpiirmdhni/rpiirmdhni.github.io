"use client";

import { useEffect, useState } from "react";
import {
    AlertCircle,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
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
    Menu,
    Plus,
    RefreshCw,
    Save,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    Upload,
    Wrench,
    X,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
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
    const [activeTab, setActiveTab] = useState<"overview" | "projects" | "experiences" | "educations" | "skills" | "languages" | "stats">("overview");
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; message: string }>({ type: "idle", message: "" });
    const [imageUploadStatus, setImageUploadStatus] = useState<string>("");

    const [tokenValidation, setTokenValidation] = useState<{
        status: "idle" | "testing" | "valid" | "invalid";
        message: string;
        userLogin?: string;
    }>({ status: "idle", message: "" });

    // Reorder helper for items and categories
    const moveItem = <T,>(list: T[], index: number, direction: "up" | "down"): T[] => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= list.length) return list;
        const copy = [...list];
        const [movedItem] = copy.splice(index, 1);
        copy.splice(targetIndex, 0, movedItem);
        return copy;
    };

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
        const cleanToken = testToken.trim();
        const cleanRepo = testRepo.trim();

        if (!cleanToken) {
            setTokenValidation({ status: "invalid", message: "Please enter your Personal Access Token." });
            return false;
        }

        // Security check: validate repository format (owner/repo)
        if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(cleanRepo)) {
            setTokenValidation({ status: "invalid", message: "Invalid repository format. Must be 'username/repository'." });
            return false;
        }

        setTokenValidation({ status: "testing", message: "Validating API Key with GitHub..." });

        try {
            const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(cleanRepo.split("/")[0])}/${encodeURIComponent(cleanRepo.split("/")[1])}`, {
                headers: { Authorization: `Bearer ${cleanToken}` },
            });

            if (res.status === 401) {
                setTokenValidation({
                    status: "invalid",
                    message: "Invalid API Key: Authentication failed (HTTP 401 Unauthorized).",
                });
                return false;
            }

            if (res.status === 404) {
                setTokenValidation({
                    status: "invalid",
                    message: `Repository "${testRepo}" not found or token lacks write permission (HTTP 404).`,
                });
                return false;
            }

            if (!res.ok) {
                const err = await res.json();
                setTokenValidation({
                    status: "invalid",
                    message: `Validation Error: ${err.message || res.statusText}`,
                });
                return false;
            }

            const repoData = await res.json();
            const canPush = repoData.permissions?.push === true || repoData.permissions?.admin === true;

            if (!canPush) {
                setTokenValidation({
                    status: "invalid",
                    message: `Token valid for reading, but lacks WRITE / PUSH permissions for ${testRepo}.`,
                    userLogin: repoData.owner?.login,
                });
                return false;
            }

            // Save valid token to local storage
            localStorage.setItem("cms_github_token", testToken.trim());
            localStorage.setItem("cms_github_repo", testRepo.trim());

            setTokenValidation({
                status: "valid",
                message: `Authentication Successful! Connected to ${testRepo} (@${repoData.owner?.login}).`,
                userLogin: repoData.owner?.login,
            });
            return true;
        } catch (err: unknown) {
            const error = err as Error;
            setTokenValidation({
                status: "invalid",
                message: `Connection Error: ${error.message}`,
            });
            return false;
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await validateToken(token, repo);
    };

    const handleLogout = () => {
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
        if (!token) return alert("Please login first.");

        // Security Check 1: File size limit (10MB max)
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            return alert("File size exceeds 10MB limit. Please upload a smaller image.");
        }

        // Security Check 2: File type validation (images only)
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
        if (!allowedTypes.includes(file.type.toLowerCase())) {
            return alert("Invalid file type. Only JPEG, PNG, WEBP, GIF, and SVG images are allowed.");
        }

        // Custom File Renaming Prompt
        const extMatch = file.name.match(/\.[0-9a-z]+$/i);
        const originalExt = extMatch ? extMatch[0].toLowerCase() : ".png";
        const defaultName = file.name.replace(/\.[0-9a-z]+$/i, "");

        const userInput = prompt("Enter target filename for uploaded image:", defaultName);
        if (userInput === null) return; // User cancelled upload

        let targetName = userInput.trim() ? userInput.trim() : defaultName;
        if (!targetName.toLowerCase().endsWith(originalExt)) {
            targetName += originalExt;
        }

        const cleanFileName = targetName.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
        const path = `public/assets/img/projects/${cleanFileName}`;

        setImageUploadStatus(`Uploading ${cleanFileName}...`);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Data = (reader.result as string).split(",")[1];

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
            if (!isValid) return alert("Please authenticate with a valid GitHub Token first.");
        }

        setStatus({ type: "loading", message: "Fetching latest file SHA from GitHub..." });

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
                message: "Changes committed successfully! GitHub Actions is building and deploying your update (~30-60s to live).",
            });
        } catch (err: unknown) {
            const error = err as Error;
            setStatus({ type: "error", message: error.message || "Failed to commit data" });
        }
    };

    // --- SCREEN 1: LOGIN AUTHENTICATION GATE (IF NOT AUTHENTICATED) ---
    if (tokenValidation.status !== "valid") {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white border-slate-200 shadow-xl rounded-2xl p-2">
                    <CardHeader className="text-center pb-4 pt-6">
                        <CardTitle className="text-xl font-bold text-slate-900">Authentication</CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Enter your Personal Access Token (PAT) to unlock the Admin Dashboard
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-4">
                        {tokenValidation.message && (
                            <div
                                className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${tokenValidation.status === "testing"
                                        ? "bg-blue-50 border-blue-200 text-blue-800"
                                        : "bg-red-50 border-red-200 text-red-800"
                                    }`}
                            >
                                {tokenValidation.status === "testing" ? (
                                    <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-600" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                                )}
                                <span>{tokenValidation.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-slate-700">Target Repository</label>
                                <Input
                                    type="text"
                                    value={repo}
                                    onChange={(e) => setRepo(e.target.value)}
                                    placeholder="rpiirmdhni/rpiirmdhni.github.io"
                                    className="bg-slate-50 border-slate-300 text-slate-900 font-mono text-xs h-10"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-slate-700">Personal Access Token (PAT)</label>
                                <Input
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="bg-slate-50 border-slate-300 text-slate-900 font-mono text-xs h-10"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={tokenValidation.status === "testing"}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold h-10 text-xs gap-2 shadow-sm mt-2"
                            >
                                {tokenValidation.status === "testing" ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Validating Key...</span>
                                    </>
                                ) : (
                                    <>
                                        <Key className="w-4 h-4" />
                                        <span>Login to Dashboard</span>
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-center text-[11px] text-slate-400">
                            <a href="/" className="text-slate-600 hover:underline flex items-center gap-1 font-medium cursor-pointer">
                                <ArrowLeft className="w-3 h-3" />
                                Back to site
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // --- SCREEN 2: MAIN CMS DASHBOARD (LIGHT MODE + PERFECT SCROLLING) ---
    return (
        <div className="h-screen w-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col md:flex-row overflow-hidden relative">
            {/* MOBILE OVERLAY BACKDROP */}
            {isMobileNavOpen && (
                <div
                    onClick={() => setIsMobileNavOpen(false)}
                    className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
                />
            )}

            {/* RESPONSIVE LIGHT SIDEBAR */}
            <aside
                className={`fixed md:static inset-y-0 left-0 z-50 transform ${
                    isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0 transition-transform duration-200 ease-in-out w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-full shadow-2xl md:shadow-none`}
            >
                <div className="flex flex-col">
                    {/* Brand Header */}
                    <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-sm text-slate-900 tracking-tight">CMS Portfolio</span>
                        </div>
                        <button
                            onClick={() => setIsMobileNavOpen(false)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 md:hidden cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation Bar */}
                    <nav className="p-3 flex flex-col gap-1">
                        {[
                            { id: "overview", label: "Overview", icon: LayoutDashboard },
                            { id: "projects", label: "Projects", icon: FolderKanban, count: data.projects.length },
                            { id: "experiences", label: "Experiences", icon: Briefcase, count: data.experiences.length },
                            { id: "educations", label: "Educations", icon: GraduationCap, count: data.educations.length },
                            { id: "skills", label: "Skills", icon: Wrench, count: data.skillGroups.length },
                            { id: "languages", label: "Languages", icon: Globe, count: data.languages.length },
                            { id: "stats", label: "About Stats", icon: BarChart3 },
                        ].map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id as typeof activeTab);
                                        setIsMobileNavOpen(false);
                                    }}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                        isActive
                                            ? "bg-slate-900 text-white font-semibold shadow-xs"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </div>
                                    {item.count !== undefined && (
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                                            {item.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-200 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                            <span className="text-xs text-slate-700 font-mono font-medium truncate">
                                @{tokenValidation.userLogin || "admin"}
                            </span>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">Online</span>
                    </div>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLogout}
                        className="w-full justify-center gap-2 border-slate-200 text-slate-700 hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-xs font-semibold h-9 cursor-pointer"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout Session</span>
                    </Button>

                    <a
                        href="/"
                        target="_blank"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>Live Portfolio Site</span>
                    </a>
                </div>
            </aside>

            {/* MAIN RIGHT CONTAINER */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50">
                {/* STICKY TOP HEADER */}
                <header className="h-16 border-b border-slate-200 bg-white px-4 md:px-6 flex items-center justify-between shrink-0 gap-2">
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => setIsMobileNavOpen(true)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden cursor-pointer"
                            title="Open Menu"
                        >
                            <Menu className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider hidden sm:inline">Dashboard</span>
                        <span className="text-slate-300 hidden sm:inline">/</span>
                        <span className="text-xs text-slate-900 font-bold capitalize">{activeTab}</span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[11px] sm:text-xs py-1 px-2 sm:px-3 gap-1 sm:gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="hidden sm:inline">Authenticated</span>
                        </Badge>

                        <Button
                            size="sm"
                            onClick={handleCommitToGitHub}
                            disabled={status.type === "loading"}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-8 px-3 sm:px-4 gap-1.5 sm:gap-2 shadow-xs cursor-pointer"
                        >
                            {status.type === "loading" ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save <span className="hidden sm:inline">& Commit</span></span>
                                </>
                            )}
                        </Button>
                    </div>
                </header>

                {/* SCROLLABLE FULL-WIDTH WRAPPER */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <main className="max-w-6xl w-full mx-auto flex flex-col gap-6">
                        {/* Status Alert Banner */}
                        {status.message && (
                            <div
                                className={`flex items-center justify-between p-4 rounded-xl text-xs font-medium border shadow-xs ${status.type === "error"
                                        ? "bg-red-50 text-red-900 border-red-200"
                                        : status.type === "success"
                                            ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                                            : "bg-blue-50 text-blue-900 border-blue-200"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {status.type === "error" && <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                                    {status.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
                                    {status.type === "loading" && <Loader2 className="w-4 h-4 shrink-0 animate-spin text-blue-600" />}
                                    <span>{status.message}</span>
                                </div>
                                <button onClick={() => setStatus({ type: "idle", message: "" })} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                    {/* OVERVIEW TAB */}
                    {activeTab === "overview" && (
                        <div className="flex flex-col gap-6">

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Featured Projects", value: data.projects.length, sub: "Active cards", icon: FolderKanban, tab: "projects" },
                                    { label: "Work Experiences", value: data.experiences.length, sub: "Timeline roles", icon: Briefcase, tab: "experiences" },
                                    { label: "Skill Categories", value: data.skillGroups.length, sub: `${data.skillGroups.reduce((a, b) => a + b.items.length, 0)} total tags`, icon: Wrench, tab: "skills" },
                                    { label: "Languages", value: data.languages.length, sub: "Fluency ratings", icon: Globe, tab: "languages" },
                                ].map((metric, i) => {
                                    const Icon = metric.icon;
                                    return (
                                        <Card
                                            key={i}
                                            onClick={() => setActiveTab(metric.tab as typeof activeTab)}
                                            className="bg-white border-slate-200 hover:border-slate-300 cursor-pointer transition-all hover:-translate-y-0.5"
                                        >
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-xs font-medium text-slate-500">{metric.label}</CardTitle>
                                                <Icon className="w-4 h-4 text-slate-700" />
                                            </CardHeader>
                                            <CardContent className="flex flex-col gap-1">
                                                <span className="text-2xl font-bold text-slate-900">{metric.value}</span>
                                                <span className="text-[11px] text-slate-500">{metric.sub}</span>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            {/* Live Projects Table Overview */}
                            <Card className="bg-white border-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
                                    <div>
                                        <CardTitle className="text-sm font-semibold text-slate-900">Live Featured Projects</CardTitle>
                                        <CardDescription className="text-xs text-slate-500">Overview of project cards rendered on portfolio</CardDescription>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => setActiveTab("projects")} className="text-xs text-slate-700 hover:text-slate-900 gap-1">
                                        <span>Manage Projects</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="divide-y divide-slate-100 pt-3">
                                    {data.projects.map((proj, idx) => (
                                        <div key={idx} className="py-3 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-400 font-mono">#{idx + 1}</span>
                                                <span className="font-semibold text-slate-900">{proj.title}</span>
                                                {proj.badge && <Badge variant="outline" className="text-[10px] py-0 px-2">{proj.badge}</Badge>}
                                            </div>
                                            <span className="text-slate-500 font-mono truncate max-w-xs">{proj.image}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* PROJECTS TAB */}
                    {activeTab === "projects" && (
                        <Card className="bg-white border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <CardTitle className="text-sm font-semibold text-slate-900">Featured Projects ({data.projects.length})</CardTitle>
                                    <CardDescription className="text-xs text-slate-500">Configure project cards, upload asset images, and link actions</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        setData({
                                            ...data,
                                            projects: [
                                                { title: "New Project", image: "/assets/img/projects/litespeak.png", description: "Project description", badge: "", links: [] },
                                                ...data.projects,
                                            ],
                                        })
                                    }
                                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Project</span>
                                </Button>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-6 pt-6">
                                {imageUploadStatus && (
                                    <div className="text-xs text-blue-800 bg-blue-50 border border-blue-200 p-3 rounded-lg font-mono flex items-center gap-2">
                                        <Upload className="w-4 h-4 text-blue-600" />
                                        <span>{imageUploadStatus}</span>
                                    </div>
                                )}

                                {data.projects.map((project, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 flex flex-col gap-4">
                                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                            <span className="text-xs font-mono font-bold text-slate-400">PROJECT #{idx + 1}</span>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={idx === 0}
                                                    onClick={() => setData({ ...data, projects: moveItem(data.projects, idx, "up") })}
                                                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                                    title="Move Up"
                                                >
                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={idx === data.projects.length - 1}
                                                    onClick={() => setData({ ...data, projects: moveItem(data.projects, idx, "down") })}
                                                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                                    title="Move Down"
                                                >
                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setData({ ...data, projects: data.projects.filter((_, i) => i !== idx) })}
                                                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7 gap-1"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span>Delete</span>
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-slate-700">Project Title</label>
                                                <Input
                                                    type="text"
                                                    value={project.title}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].title = e.target.value;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="bg-white border-slate-300 text-slate-900 text-xs"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-slate-700">Badge Tag (Optional)</label>
                                                <Input
                                                    type="text"
                                                    value={project.badge || ""}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].badge = e.target.value || undefined;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="bg-white border-slate-300 text-slate-900 text-xs"
                                                    placeholder="e.g. Private"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold text-slate-700">Image Asset Path / Upload</label>
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    type="text"
                                                    value={project.image}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].image = e.target.value;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="bg-white border-slate-300 text-slate-900 font-mono text-xs"
                                                />
                                                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors whitespace-nowrap">
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
                                            <label className="text-xs font-semibold text-slate-700">Description</label>
                                            <textarea
                                                rows={2}
                                                value={project.description}
                                                onChange={(e) => {
                                                    const copy = [...data.projects];
                                                    copy[idx].description = e.target.value;
                                                    setData({ ...data, projects: copy });
                                                }}
                                                className="w-full text-xs border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900"
                                            />
                                        </div>

                                        {/* Links */}
                                        <div className="flex flex-col gap-2 pt-3 border-t border-slate-200">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-semibold text-slate-700">Action Button Links</label>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        const copy = [...data.projects];
                                                        copy[idx].links = [...(copy[idx].links || []), { type: "github", href: "", label: "View Link" }];
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="text-xs text-slate-700 hover:text-slate-900 font-semibold h-7 gap-1"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>Add Link</span>
                                                </Button>
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
                                                        className="text-xs border border-slate-300 p-2 rounded-lg bg-white text-slate-900"
                                                    >
                                                        <option value="github">GitHub</option>
                                                        <option value="npm">NPM</option>
                                                        <option value="figma">Figma</option>
                                                    </select>
                                                    <Input
                                                        type="text"
                                                        value={link.label}
                                                        onChange={(e) => {
                                                            const copy = [...data.projects];
                                                            if (copy[idx].links) copy[idx].links![lIdx].label = e.target.value;
                                                            setData({ ...data, projects: copy });
                                                        }}
                                                        placeholder="Button Label"
                                                        className="bg-white border-slate-300 text-slate-900 text-xs w-1/3"
                                                    />
                                                    <Input
                                                        type="text"
                                                        value={link.href}
                                                        onChange={(e) => {
                                                            const copy = [...data.projects];
                                                            if (copy[idx].links) copy[idx].links![lIdx].href = e.target.value;
                                                            setData({ ...data, projects: copy });
                                                        }}
                                                        placeholder="URL"
                                                        className="bg-white border-slate-300 text-slate-900 font-mono text-xs w-full"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const copy = [...data.projects];
                                                            copy[idx].links = copy[idx].links?.filter((_, i) => i !== lIdx);
                                                            setData({ ...data, projects: copy });
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-red-600"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* EXPERIENCES TAB */}
                    {activeTab === "experiences" && (
                        <Card className="bg-white border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <CardTitle className="text-sm font-semibold text-slate-900">Work & Leadership Experiences ({data.experiences.length})</CardTitle>
                                    <CardDescription className="text-xs text-slate-500">Timeline of professional roles and memberships</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        setData({
                                            ...data,
                                            experiences: [{ period: "2026 - Present", title: "New Role", organization: "Organization Name", current: true }, ...data.experiences],
                                        })
                                    }
                                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Experience</span>
                                </Button>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-4 pt-6">
                                {data.experiences.map((exp, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-mono font-bold text-slate-400">ENTRY #{idx + 1}</span>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={idx === 0}
                                                    onClick={() => setData({ ...data, experiences: moveItem(data.experiences, idx, "up") })}
                                                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                                    title="Move Up"
                                                >
                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={idx === data.experiences.length - 1}
                                                    onClick={() => setData({ ...data, experiences: moveItem(data.experiences, idx, "down") })}
                                                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                                    title="Move Down"
                                                >
                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setData({ ...data, experiences: data.experiences.filter((_, i) => i !== idx) })}
                                                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7 gap-1"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span>Delete</span>
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <Input
                                                type="text"
                                                value={exp.period}
                                                onChange={(e) => {
                                                    const copy = [...data.experiences];
                                                    copy[idx].period = e.target.value;
                                                    setData({ ...data, experiences: copy });
                                                }}
                                                placeholder="Period"
                                                className="bg-white border-slate-300 text-slate-900 text-xs"
                                            />
                                            <Input
                                                type="text"
                                                value={exp.title}
                                                onChange={(e) => {
                                                    const copy = [...data.experiences];
                                                    copy[idx].title = e.target.value;
                                                    setData({ ...data, experiences: copy });
                                                }}
                                                placeholder="Role / Title"
                                                className="bg-white border-slate-300 text-slate-900 text-xs"
                                            />
                                            <Input
                                                type="text"
                                                value={exp.organization}
                                                onChange={(e) => {
                                                    const copy = [...data.experiences];
                                                    copy[idx].organization = e.target.value;
                                                    setData({ ...data, experiences: copy });
                                                }}
                                                placeholder="Organization"
                                                className="bg-white border-slate-300 text-slate-900 text-xs"
                                            />
                                            <Input
                                                type="text"
                                                value={exp.badge || ""}
                                                onChange={(e) => {
                                                    const copy = [...data.experiences];
                                                    copy[idx].badge = e.target.value || undefined;
                                                    setData({ ...data, experiences: copy });
                                                }}
                                                placeholder="Badge (e.g. Freelance)"
                                                className="bg-white border-slate-300 text-slate-900 text-xs"
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
                                                className="rounded border-slate-300 text-slate-900"
                                            />
                                            <span>Current / Ongoing Role (Blue Dot Indicator)</span>
                                        </label>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* EDUCATIONS TAB */}
                    {activeTab === "educations" && (
                        <Card className="bg-white border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <CardTitle className="text-sm font-semibold text-slate-900">Education Timeline ({data.educations.length})</CardTitle>
                                    <CardDescription className="text-xs text-slate-500">Academic institutions and degrees</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        setData({
                                            ...data,
                                            educations: [{ period: "2026 - Present", title: "Field of Study", organization: "Institution Name", current: true }, ...data.educations],
                                        })
                                    }
                                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Education</span>
                                </Button>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-4 pt-6">
                                {data.educations.map((edu, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-mono font-bold text-slate-400">ENTRY #{idx + 1}</span>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={idx === 0}
                                                    onClick={() => setData({ ...data, educations: moveItem(data.educations, idx, "up") })}
                                                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                                    title="Move Up"
                                                >
                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={idx === data.educations.length - 1}
                                                    onClick={() => setData({ ...data, educations: moveItem(data.educations, idx, "down") })}
                                                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                                    title="Move Down"
                                                >
                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setData({ ...data, educations: data.educations.filter((_, i) => i !== idx) })}
                                                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7 gap-1"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span>Delete</span>
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <Input
                                                type="text"
                                                value={edu.period}
                                                onChange={(e) => {
                                                    const copy = [...data.educations];
                                                    copy[idx].period = e.target.value;
                                                    setData({ ...data, educations: copy });
                                                }}
                                                placeholder="Period"
                                                className="bg-white border-slate-300 text-slate-900 text-xs"
                                            />
                                            <Input
                                                type="text"
                                                value={edu.title}
                                                onChange={(e) => {
                                                    const copy = [...data.educations];
                                                    copy[idx].title = e.target.value;
                                                    setData({ ...data, educations: copy });
                                                }}
                                                placeholder="Major / Field of Study"
                                                className="bg-white border-slate-300 text-slate-900 text-xs"
                                            />
                                            <Input
                                                type="text"
                                                value={edu.organization}
                                                onChange={(e) => {
                                                    const copy = [...data.educations];
                                                    copy[idx].organization = e.target.value;
                                                    setData({ ...data, educations: copy });
                                                }}
                                                placeholder="School / University"
                                                className="bg-white border-slate-300 text-slate-900 text-xs"
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
                                                className="rounded border-slate-300 text-slate-900"
                                            />
                                            <span>Currently Studying (Blue Dot Indicator)</span>
                                        </label>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* SKILLS TAB */}
                    {activeTab === "skills" && (
                        <Card className="bg-white border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <CardTitle className="text-sm font-semibold text-slate-900">Technical & Soft Skill Groups ({data.skillGroups.length})</CardTitle>
                                    <CardDescription className="text-xs text-slate-500">Group skills by categories and comma-separated tags</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => setData({ ...data, skillGroups: [...data.skillGroups, { title: "New Category", items: ["Skill Item"] }] })}
                                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Category</span>
                                </Button>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-6 pt-6">
                                {data.skillGroups.map((group, sIdx) => (
                                    <div key={sIdx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <Input
                                                type="text"
                                                value={group.title}
                                                onChange={(e) => {
                                                    const copy = [...data.skillGroups];
                                                    copy[sIdx].title = e.target.value;
                                                    setData({ ...data, skillGroups: copy });
                                                }}
                                                className="bg-white border-slate-300 text-slate-900 font-bold text-xs w-60"
                                            />
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={sIdx === 0}
                                                    onClick={() => setData({ ...data, skillGroups: moveItem(data.skillGroups, sIdx, "up") })}
                                                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                                    title="Move Category Up"
                                                >
                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={sIdx === data.skillGroups.length - 1}
                                                    onClick={() => setData({ ...data, skillGroups: moveItem(data.skillGroups, sIdx, "down") })}
                                                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                                    title="Move Category Down"
                                                >
                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setData({ ...data, skillGroups: data.skillGroups.filter((_, i) => i !== sIdx) })}
                                                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7 gap-1"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span>Delete Category</span>
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold text-slate-700">Items (comma-separated)</label>
                                            <textarea
                                                rows={2}
                                                value={group.items.join(", ")}
                                                onChange={(e) => {
                                                    const copy = [...data.skillGroups];
                                                    copy[sIdx].items = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                                                    setData({ ...data, skillGroups: copy });
                                                }}
                                                className="w-full text-xs border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900 font-mono"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* LANGUAGES TAB */}
                    {activeTab === "languages" && (
                        <Card className="bg-white border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <CardTitle className="text-sm font-semibold text-slate-900">Languages & Fluency ({data.languages.length})</CardTitle>
                                    <CardDescription className="text-xs text-slate-500">Language fluency and progress bar percentages</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => setData({ ...data, languages: [...data.languages, { name: "Language", level: "Proficiency Level", percent: 80 }] })}
                                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Language</span>
                                </Button>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-4 pt-6">
                                {data.languages.map((lang, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex items-center gap-3">
                                        <Input
                                            type="text"
                                            value={lang.name}
                                            onChange={(e) => {
                                                const copy = [...data.languages];
                                                copy[idx].name = e.target.value;
                                                setData({ ...data, languages: copy });
                                            }}
                                            placeholder="Language"
                                            className="bg-white border-slate-300 text-slate-900 text-xs w-1/4"
                                        />
                                        <Input
                                            type="text"
                                            value={lang.level}
                                            onChange={(e) => {
                                                const copy = [...data.languages];
                                                copy[idx].level = e.target.value;
                                                setData({ ...data, languages: copy });
                                            }}
                                            placeholder="Level Description"
                                            className="bg-white border-slate-300 text-slate-900 text-xs w-1/2"
                                        />
                                        <div className="flex items-center gap-1 w-1/4">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={lang.percent}
                                                onChange={(e) => {
                                                    const copy = [...data.languages];
                                                    copy[idx].percent = Number(e.target.value);
                                                    setData({ ...data, languages: copy });
                                                }}
                                                className="bg-white border-slate-300 text-slate-900 font-mono text-xs w-full"
                                            />
                                            <span className="text-xs font-semibold text-slate-500">%</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                disabled={idx === 0}
                                                onClick={() => setData({ ...data, languages: moveItem(data.languages, idx, "up") })}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                                title="Move Up"
                                            >
                                                <ArrowUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                disabled={idx === data.languages.length - 1}
                                                onClick={() => setData({ ...data, languages: moveItem(data.languages, idx, "down") })}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                                title="Move Down"
                                            >
                                                <ArrowDown className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setData({ ...data, languages: data.languages.filter((_, i) => i !== idx)} )}
                                                className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* STATS TAB */}
                    {activeTab === "stats" && (
                        <Card className="bg-white border-slate-200">
                            <CardHeader className="border-b border-slate-100 pb-4">
                                <CardTitle className="text-sm font-semibold text-slate-900">About Me Stat Cards</CardTitle>
                                <CardDescription className="text-xs text-slate-500">Values and subtext labels for the three main stats cards</CardDescription>
                            </CardHeader>

                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {data.aboutStats.map((stat, idx) => (
                                        <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-mono font-bold text-slate-400">METRIC #{idx + 1}</span>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        disabled={idx === 0}
                                                        onClick={() => setData({ ...data, aboutStats: moveItem(data.aboutStats, idx, "up") })}
                                                        className="h-6 w-6 p-0 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                                        title="Move Up"
                                                    >
                                                        <ArrowUp className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        disabled={idx === data.aboutStats.length - 1}
                                                        onClick={() => setData({ ...data, aboutStats: moveItem(data.aboutStats, idx, "down") })}
                                                        className="h-6 w-6 p-0 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                                        title="Move Down"
                                                    >
                                                        <ArrowDown className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-slate-700">Display Value</label>
                                                <Input
                                                    type="text"
                                                    value={stat.value}
                                                    onChange={(e) => {
                                                        const copy = [...data.aboutStats];
                                                        copy[idx].value = e.target.value;
                                                        setData({ ...data, aboutStats: copy });
                                                    }}
                                                    placeholder="e.g. 19"
                                                    className="bg-white border-slate-300 text-slate-900 font-bold text-xs"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-slate-700">Subtext Label</label>
                                                <Input
                                                    type="text"
                                                    value={stat.label}
                                                    onChange={(e) => {
                                                        const copy = [...data.aboutStats];
                                                        copy[idx].label = e.target.value;
                                                        setData({ ...data, aboutStats: copy });
                                                    }}
                                                    placeholder="e.g. Years Old"
                                                    className="bg-white border-slate-300 text-slate-900 text-xs"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    </main>
                </div>
            </div>
        </div>
    );
}
