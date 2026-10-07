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

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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

    useEffect(() => {
        const savedToken = localStorage.getItem("cms_github_token") || "";
        const savedRepo = localStorage.getItem("cms_github_repo") || "rpiirmdhni/rpiirmdhni.github.io";

        if (savedToken) {
            setToken(savedToken);
            setRepo(savedRepo);
            validateToken(savedToken, savedRepo);
        }
    }, []);

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
                    message: "Invalid Token: Token expired or authentication failed (HTTP 401 Unauthorized).",
                    canPush: false,
                });
                return false;
            }

            if (res.status === 404) {
                setTokenValidation({
                    status: "invalid",
                    message: `Repository "${testRepo}" not found or token lacks access permission (HTTP 404).`,
                    canPush: false,
                });
                return false;
            }

            if (!res.ok) {
                const err = await res.json();
                setTokenValidation({
                    status: "invalid",
                    message: `Validation error: ${err.message || res.statusText}`,
                    canPush: false,
                });
                return false;
            }

            const repoData = await res.json();
            const canPush = repoData.permissions?.push === true || repoData.permissions?.admin === true;

            if (!canPush) {
                setTokenValidation({
                    status: "invalid",
                    message: `Token is valid, but lacks WRITE / PUSH permissions for ${testRepo}.`,
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
            {/* SHADCN DASHBOARD SIDEBAR */}
            <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
                <div className="flex flex-col">
                    {/* Brand Header */}
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                RR
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm text-slate-100 tracking-tight">Rafie CMS</span>
                                <span className="text-[10px] text-slate-400 font-mono">shadcn/ui official</span>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Navigation */}
                    <nav className="p-3 flex flex-col gap-1">
                        {[
                            { id: "overview", label: "Overview", icon: LayoutDashboard },
                            { id: "projects", label: "Projects", icon: FolderKanban, count: data.projects.length },
                            { id: "experiences", label: "Experiences", icon: Briefcase, count: data.experiences.length },
                            { id: "educations", label: "Educations", icon: GraduationCap, count: data.educations.length },
                            { id: "skills", label: "Skills", icon: Wrench, count: data.skillGroups.length },
                            { id: "languages", label: "Languages", icon: Globe, count: data.languages.length },
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
                                    {item.count !== undefined && (
                                        <Badge variant={isActive ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
                                            {item.count}
                                        </Badge>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-2.5 py-2 bg-slate-950 rounded-lg border border-slate-800">
                        {tokenValidation.status === "valid" ? (
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        )}
                        <span className="text-[11px] text-slate-300 font-mono truncate">
                            {tokenValidation.status === "valid" ? `@${tokenValidation.userLogin || "authenticated"}` : "Disconnected"}
                        </span>
                    </div>

                    <a
                        href="/"
                        target="_blank"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Portfolio</span>
                    </a>
                </div>
            </aside>

            {/* MAIN DASHBOARD CONTAINER */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
                {/* TOP HEADER BAR */}
                <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Dashboard</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-xs text-slate-100 font-bold capitalize">{activeTab}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {tokenValidation.status === "valid" ? (
                            <Badge variant="secondary" className="bg-emerald-950/80 text-emerald-400 border-emerald-800 gap-1.5 text-xs py-1 px-3">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>API Key Validated</span>
                            </Badge>
                        ) : (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setActiveTab("settings")}
                                className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-xs gap-1.5 h-8 px-3"
                            >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Configure API Key</span>
                            </Button>
                        )}

                        <Button
                            size="sm"
                            onClick={handleCommitToGitHub}
                            disabled={status.type === "loading"}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-8 px-4 gap-2 shadow-sm"
                        >
                            {status.type === "loading" ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Committing...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save & Commit</span>
                                </>
                            )}
                        </Button>
                    </div>
                </header>

                {/* DASHBOARD BODY */}
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
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-950 border border-blue-800 text-blue-400 rounded-lg">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-semibold text-slate-100">🔒 Local Token Security & Privacy</CardTitle>
                                            <CardDescription className="text-xs text-slate-400">
                                                Your GitHub Personal Access Token is stored <strong>100% locally in your browser</strong> (`localStorage`).
                                                Only your local device can push commits to your repository.
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => validateToken(token, repo)}
                                        className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs gap-1.5"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>Check Token</span>
                                    </Button>
                                </CardHeader>
                            </Card>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Featured Projects", value: data.projects.length, sub: "Showcase items", icon: FolderKanban, tab: "projects" },
                                    { label: "Work Experiences", value: data.experiences.length, sub: "Timeline roles", icon: Briefcase, tab: "experiences" },
                                    { label: "Skill Categories", value: data.skillGroups.length, sub: `${data.skillGroups.reduce((a, b) => a + b.items.length, 0)} total tags`, icon: Wrench, tab: "skills" },
                                    { label: "Languages", value: data.languages.length, sub: "Fluency ratings", icon: Globe, tab: "languages" },
                                ].map((metric, i) => {
                                    const Icon = metric.icon;
                                    return (
                                        <Card
                                            key={i}
                                            onClick={() => setActiveTab(metric.tab as typeof activeTab)}
                                            className="bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer transition-all hover:-translate-y-0.5"
                                        >
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-xs font-medium text-slate-400">{metric.label}</CardTitle>
                                                <Icon className="w-4 h-4 text-blue-400" />
                                            </CardHeader>
                                            <CardContent className="flex flex-col gap-1">
                                                <span className="text-2xl font-bold text-slate-100">{metric.value}</span>
                                                <span className="text-[11px] text-slate-400">{metric.sub}</span>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            {/* Live Projects Table Overview */}
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-3">
                                    <div>
                                        <CardTitle className="text-sm font-semibold text-slate-100">Live Featured Projects</CardTitle>
                                        <CardDescription className="text-xs text-slate-400">Current active projects rendered on your portfolio</CardDescription>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => setActiveTab("projects")} className="text-xs text-blue-400 hover:text-blue-300">
                                        Manage Projects →
                                    </Button>
                                </CardHeader>
                                <CardContent className="divide-y divide-slate-800 pt-3">
                                    {data.projects.map((proj, idx) => (
                                        <div key={idx} className="py-3 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-500 font-mono">#{idx + 1}</span>
                                                <span className="font-semibold text-slate-200">{proj.title}</span>
                                                {proj.badge && <Badge variant="secondary" className="text-[10px] py-0 px-2">{proj.badge}</Badge>}
                                            </div>
                                            <span className="text-slate-400 font-mono truncate max-w-xs">{proj.image}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* API SETTINGS TAB */}
                    {activeTab === "settings" && (
                        <div className="flex flex-col gap-6 max-w-3xl">
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader className="border-b border-slate-800 pb-4 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-semibold text-slate-100">GitHub API Credentials & Validation</CardTitle>
                                        <CardDescription className="text-xs text-slate-400">Validate Personal Access Token (PAT) and test push access</CardDescription>
                                    </div>
                                    {tokenValidation.status === "valid" ? (
                                        <Badge variant="secondary" className="bg-emerald-950 text-emerald-400 border-emerald-800 text-xs py-1 px-3 gap-1">
                                            <UserCheck className="w-3.5 h-3.5" />
                                            <span>Validated</span>
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="bg-red-950 text-red-400 border-red-800 text-xs py-1 px-3 gap-1">
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                            <span>Validation Required</span>
                                        </Badge>
                                    )}
                                </CardHeader>

                                <CardContent className="flex flex-col gap-5 pt-5">
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
                                                <span className="font-semibold">Validation Response:</span>
                                                <span>{tokenValidation.message}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-slate-300">Target Repository</label>
                                            <Input
                                                type="text"
                                                value={repo}
                                                onChange={(e) => setRepo(e.target.value)}
                                                className="border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs"
                                                placeholder="rpiirmdhni/rpiirmdhni.github.io"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-slate-300">Personal Access Token (PAT)</label>
                                            <Input
                                                type="password"
                                                value={token}
                                                onChange={(e) => setToken(e.target.value)}
                                                className="border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs"
                                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                            />
                                            <span className="text-[11px] text-slate-500">Requires `contents: write` or `repo` scope.</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <Button size="sm" onClick={handleSaveConfig} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs gap-2">
                                            <Key className="w-3.5 h-3.5" />
                                            <span>Save & Test Token</span>
                                        </Button>

                                        {token && (
                                            <Button size="sm" variant="outline" onClick={handleDisconnect} className="border-red-800 text-red-400 hover:bg-red-950 text-xs gap-1.5">
                                                <LogOut className="w-3.5 h-3.5" />
                                                <span>Clear Credentials</span>
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* PROJECTS TAB */}
                    {activeTab === "projects" && (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <CardTitle className="text-sm font-semibold text-slate-100">Featured Projects ({data.projects.length})</CardTitle>
                                    <CardDescription className="text-xs text-slate-400">Configure project cards, upload asset images, and link actions</CardDescription>
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
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Project</span>
                                </Button>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-6 pt-6">
                                {imageUploadStatus && (
                                    <div className="text-xs text-blue-300 bg-blue-950/80 border border-blue-800 p-3 rounded-lg font-mono flex items-center gap-2">
                                        <Upload className="w-4 h-4 text-blue-400" />
                                        <span>{imageUploadStatus}</span>
                                    </div>
                                )}

                                {data.projects.map((project, idx) => (
                                    <div key={idx} className="border border-slate-800 rounded-xl p-5 bg-slate-950/60 flex flex-col gap-4">
                                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                            <span className="text-xs font-mono font-bold text-slate-500">PROJECT #{idx + 1}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setData({ ...data, projects: data.projects.filter((_, i) => i !== idx) })}
                                                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 h-7 gap-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete</span>
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-medium text-slate-300">Project Title</label>
                                                <Input
                                                    type="text"
                                                    value={project.title}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].title = e.target.value;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="border-slate-700 bg-slate-900 text-slate-100 text-xs"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-medium text-slate-300">Badge Tag (Optional)</label>
                                                <Input
                                                    type="text"
                                                    value={project.badge || ""}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].badge = e.target.value || undefined;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="border-slate-700 bg-slate-900 text-slate-100 text-xs"
                                                    placeholder="e.g. Private"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-slate-300">Image Asset Path / Upload</label>
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    type="text"
                                                    value={project.image}
                                                    onChange={(e) => {
                                                        const copy = [...data.projects];
                                                        copy[idx].image = e.target.value;
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="border-slate-700 bg-slate-900 text-slate-100 font-mono text-xs"
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
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        const copy = [...data.projects];
                                                        copy[idx].links = [...(copy[idx].links || []), { type: "github", href: "", label: "View Link" }];
                                                        setData({ ...data, projects: copy });
                                                    }}
                                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium h-7 gap-1"
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
                                                        className="text-xs border border-slate-700 p-2 rounded-lg bg-slate-900 text-slate-100"
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
                                                        className="border-slate-700 bg-slate-900 text-slate-100 text-xs w-1/3"
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
                                                        className="border-slate-700 bg-slate-900 text-slate-100 font-mono text-xs w-full"
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
                            </CardContent>
                        </Card>
                    )}

                    {/* EXPERIENCES TAB */}
                    {activeTab === "experiences" && (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <CardTitle className="text-sm font-semibold text-slate-100">Work & Leadership Experiences ({data.experiences.length})</CardTitle>
                                    <CardDescription className="text-xs text-slate-400">Timeline of professional roles and memberships</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        setData({
                                            ...data,
                                            experiences: [{ period: "2026 - Present", title: "New Role", organization: "Organization Name", current: true }, ...data.experiences],
                                        })
                                    }
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Experience</span>
                                </Button>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-4 pt-6">
                                {data.experiences.map((exp, idx) => (
                                    <div key={idx} className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-mono font-bold text-slate-500">ENTRY #{idx + 1}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setData({ ...data, experiences: data.experiences.filter((_, i) => i !== idx) })}
                                                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 h-7 gap-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete</span>
                                            </Button>
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
                                                className="border-slate-700 bg-slate-900 text-slate-100 text-xs"
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
                                                className="border-slate-700 bg-slate-900 text-slate-100 text-xs"
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
                                                className="border-slate-700 bg-slate-900 text-slate-100 text-xs"
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
                                                className="border-slate-700 bg-slate-900 text-slate-100 text-xs"
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
                            </CardContent>
                        </Card>
                    )}

                    {/* EDUCATIONS TAB */}
                    {activeTab === "educations" && (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <CardTitle className="text-sm font-semibold text-slate-100">Education Timeline ({data.educations.length})</CardTitle>
                                    <CardDescription className="text-xs text-slate-400">Academic institutions and degrees</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        setData({
                                            ...data,
                                            educations: [{ period: "2026 - Present", title: "Field of Study", organization: "Institution Name", current: true }, ...data.educations],
                                        })
                                    }
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Education</span>
                                </Button>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-4 pt-6">
                                {data.educations.map((edu, idx) => (
                                    <div key={idx} className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-mono font-bold text-slate-500">ENTRY #{idx + 1}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setData({ ...data, educations: data.educations.filter((_, i) => i !== idx) })}
                                                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 h-7 gap-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete</span>
                                            </Button>
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
                                                className="border-slate-700 bg-slate-900 text-slate-100 text-xs"
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
                                                className="border-slate-700 bg-slate-900 text-slate-100 text-xs"
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
                                                className="border-slate-700 bg-slate-900 text-slate-100 text-xs"
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
                            </CardContent>
                        </Card>
                    )}

                    {/* SKILLS TAB */}
                    {activeTab === "skills" && (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <CardTitle className="text-sm font-semibold text-slate-100">Technical & Soft Skill Groups ({data.skillGroups.length})</CardTitle>
                                    <CardDescription className="text-xs text-slate-400">Group skills by categories and comma-separated tags</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => setData({ ...data, skillGroups: [...data.skillGroups, { title: "New Category", items: ["Skill Item"] }] })}
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Category</span>
                                </Button>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-6 pt-6">
                                {data.skillGroups.map((group, sIdx) => (
                                    <div key={sIdx} className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <Input
                                                type="text"
                                                value={group.title}
                                                onChange={(e) => {
                                                    const copy = [...data.skillGroups];
                                                    copy[sIdx].title = e.target.value;
                                                    setData({ ...data, skillGroups: copy });
                                                }}
                                                className="border-slate-700 bg-slate-900 text-slate-100 font-bold text-xs w-60"
                                            />
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setData({ ...data, skillGroups: data.skillGroups.filter((_, i) => i !== sIdx) })}
                                                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 h-7 gap-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete Category</span>
                                            </Button>
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
                            </CardContent>
                        </Card>
                    )}

                    {/* LANGUAGES TAB */}
                    {activeTab === "languages" && (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <CardTitle className="text-sm font-semibold text-slate-100">Languages & Fluency ({data.languages.length})</CardTitle>
                                    <CardDescription className="text-xs text-slate-400">Language fluency and progress bar percentages</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => setData({ ...data, languages: [...data.languages, { name: "Language", level: "Proficiency Level", percent: 80 }] })}
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Language</span>
                                </Button>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-4 pt-6">
                                {data.languages.map((lang, idx) => (
                                    <div key={idx} className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 flex items-center gap-3">
                                        <Input
                                            type="text"
                                            value={lang.name}
                                            onChange={(e) => {
                                                const copy = [...data.languages];
                                                copy[idx].name = e.target.value;
                                                setData({ ...data, languages: copy });
                                            }}
                                            placeholder="Language"
                                            className="border-slate-700 bg-slate-900 text-slate-100 text-xs w-1/4"
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
                                            className="border-slate-700 bg-slate-900 text-slate-100 text-xs w-1/2"
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
                                                className="border-slate-700 bg-slate-900 text-slate-100 font-mono text-xs w-full"
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
                            </CardContent>
                        </Card>
                    )}

                    {/* STATS TAB */}
                    {activeTab === "stats" && (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="border-b border-slate-800 pb-4">
                                <CardTitle className="text-sm font-semibold text-slate-100">About Me Stat Cards</CardTitle>
                                <CardDescription className="text-xs text-slate-400">Values and subtext labels for the three main stats cards</CardDescription>
                            </CardHeader>

                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {data.aboutStats.map((stat, idx) => (
                                        <div key={idx} className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 flex flex-col gap-3">
                                            <span className="text-xs font-mono font-bold text-slate-500">METRIC #{idx + 1}</span>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-medium text-slate-300">Display Value</label>
                                                <Input
                                                    type="text"
                                                    value={stat.value}
                                                    onChange={(e) => {
                                                        const copy = [...data.aboutStats];
                                                        copy[idx].value = e.target.value;
                                                        setData({ ...data, aboutStats: copy });
                                                    }}
                                                    placeholder="e.g. 19"
                                                    className="border-slate-700 bg-slate-900 text-slate-100 font-bold text-xs"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-medium text-slate-300">Subtext Label</label>
                                                <Input
                                                    type="text"
                                                    value={stat.label}
                                                    onChange={(e) => {
                                                        const copy = [...data.aboutStats];
                                                        copy[idx].label = e.target.value;
                                                        setData({ ...data, aboutStats: copy });
                                                    }}
                                                    placeholder="e.g. Years Old"
                                                    className="border-slate-700 bg-slate-900 text-slate-100 text-xs"
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
    );
}
