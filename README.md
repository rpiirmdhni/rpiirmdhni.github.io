# 🌐 Rafie Restu Ramadhani — Personal Portfolio & Headless GitHub CMS

[![Live Site](https://img.shields.io/badge/Live_Portfolio-rpiirmdhni.github.io-blue?style=for-the-badge&logo=github)](https://rpiirmdhni.github.io)
[![Admin CMS](https://img.shields.io/badge/CMS_Admin-Dashboard-emerald?style=for-the-badge&logo=shadcnui)](https://rpiirmdhni.github.io/admin)
[![Next.js 16](https://img.shields.io/badge/Next.js-16_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)

Modern, high-performance personal portfolio website built with **Next.js 16 (Turbopack)**, **React 19**, **TypeScript**, and **TailwindCSS v4**. Features a built-in, serverless **Headless CMS Admin Dashboard (`/admin`)** powered by **`shadcn/ui`** that enables client-side authentication and automatic git commits directly to GitHub.

---

## ✨ Key Features

- ⚡ **Next.js 16 App Router & Static Export**: Zero-latency static site generation (`output: "export"`) deployed directly to GitHub Pages.
- 🎨 **Pixel-Perfect Design System**: 1:1 visual fidelity to the original portfolio aesthetic (`bg-olive-50`, `taupe-950`, `Bricolage Grotesque`, and `Plus Jakarta Sans` typography).
- 🔒 **Headless CMS Admin Dashboard (`/admin`)**:
  - Pure Light Mode `shadcn/ui` dashboard interface.
  - **Client-Side GitHub PAT Authentication**: Direct REST API handshake with GitHub; no third-party server or database required.
  - **Real-Time Data Management**: Edit projects, work experiences, education timeline, technical skill groups, languages, and about stats.
  - 🔀 **Item Reordering (Move Up / Down)**: Easily adjust the sequence of categories, project cards, and timeline entries.
  - 🖼️ **Direct Asset Uploads**: Upload project image assets straight to `public/assets/img/projects/` via GitHub Contents API.
- 🤖 **AI Agent Optimization**: Comprehensive `llms.txt`, SEO metadata, and JSON-LD Schema.org rich snippets for AI crawlers & search engines.
- 🚀 **Automated CI/CD**: Automatic build & deployment to GitHub Pages via GitHub Actions whenever changes are committed through the CMS.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com), [Lucide Icons](https://lucide.dev)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com)
- **Carousel**: [Splide.js](https://splidejs.com)
- **Deployment**: [GitHub Pages](https://pages.github.com)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18.0 or higher
- `npm` or `pnpm` or `yarn`

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/rpiirmdhni/rpiirmdhni.github.io.git
cd rpiirmdhni.github.io/porto-next

# Install dependencies
npm install
```

### 2. Development Server

Run the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the live portfolio.  
Access the CMS Admin Dashboard at [http://localhost:3000/admin](http://localhost:3000/admin).

### 3. Production Build

Validate static export compilation:

```bash
npm run build
```

Output files will be generated in the `out/` folder for static hosting.

---

## 🔑 CMS Admin Guide (`/admin`)

The Admin Dashboard allows updating portfolio contents directly from the web browser without editing JSON code manually.

### How to Authenticate:

1. Open `/admin` on your browser.
2. Enter your **Target Repository**: `rpiirmdhni/rpiirmdhni.github.io`
3. Enter your **GitHub Personal Access Token (PAT)**:
   - Generate a token at [GitHub Token Settings](https://github.com/settings/tokens).
   - Select **Generate new token (classic)**.
   - Check the **`repo`** scope (Full control of repositories).
4. Click **Login to Dashboard**.
5. Make your edits (add/remove projects, upload images, reorder skill categories, etc.).
6. Click **Save & Commit to GitHub** to trigger an automated GitHub Actions deployment.

---

## 📁 Project Structure

```text
porto-next/
├── public/
│   ├── assets/              # Profile images, project assets, vector icons
│   ├── llms.txt             # AI agent guidance file
│   ├── robots.txt           # Search engine directives
│   └── sitemap.xml          # Search engine sitemap
├── src/
│   ├── app/
│   │   ├── admin/           # CMS Admin Dashboard (/admin)
│   │   ├── globals.css      # Design system tokens & Tailwind imports
│   │   ├── layout.tsx       # Root layout & SEO JSON-LD schema
│   │   └── page.tsx         # Main portfolio single-page app
│   ├── components/
│   │   ├── layout/          # Header, Sidebar, Navigation
│   │   ├── sections/        # FeaturedProjects, AboutMe, Skills, Experiences, etc.
│   │   └── ui/              # shadcn/ui primitives (Button, Card, Input, Badge, etc.)
│   ├── data/
│   │   └── portfolio.json   # Single source of truth for portfolio contents
│   └── lib/
│       └── utils.ts         # Utility functions (cn, clsx, tailwind-merge)
├── components.json          # shadcn/ui configuration
├── next.config.ts           # Next.js export & image configuration
└── package.json
```

---

## 📄 License

Created by **[Rafie Restu Ramadhani](https://github.com/rpiirmdhni)**. All rights reserved.
