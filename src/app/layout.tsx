import type { Metadata, Viewport } from "next";
import "@splidejs/splide/css";
import "./globals.css";

const siteUrl = "https://rpiirmdhni.github.io";

export const viewport: Viewport = {
    themeColor: "#f7f7f2",
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "Rafie Restu Ramadhani — Software Developer, AI & IoT Creator",
        template: "%s | Rafie Restu Ramadhani",
    },
    description:
        "Official Personal Portfolio of Rafie Restu Ramadhani (rpiirmdhni). Information System Student at Gunadarma University, Founder & CEO at Meluna. Building digital products, exploring AI, IoT, and high-performance Web Applications.",
    keywords: [
        "Rafie Restu Ramadhani",
        "rpiirmdhni",
        "Rafie Restu Ramadhani Portfolio",
        "Software Developer Tangerang",
        "Gunadarma University Information System",
        "LiteSpeak IoT",
        "ECOTRA PKM-KC",
        "Meluna CEO",
        "AI Agent Workforce",
        "Fullstack Developer Indonesia",
        "Next.js Developer Tangerang",
        "React Engineer",
        "TypeScript Developer",
    ],
    authors: [{ name: "Rafie Restu Ramadhani", url: siteUrl }],
    creator: "Rafie Restu Ramadhani",
    publisher: "Rafie Restu Ramadhani",
    formatDetection: {
        email: true,
        address: true,
        telephone: true,
    },
    alternates: {
        canonical: siteUrl,
    },
    openGraph: {
        type: "profile",
        locale: "en_US",
        url: siteUrl,
        title: "Rafie Restu Ramadhani — Software Developer, AI & IoT Creator",
        description:
            "Ideas into Real Impact. Official portfolio of Rafie Restu Ramadhani (rpiirmdhni) - Founder @ Meluna & Information System student at Gunadarma University.",
        siteName: "Rafie Restu Ramadhani Portfolio",
        images: [
            {
                url: "/assets/img/profile.jpg",
                width: 1200,
                height: 1200,
                alt: "Rafie Restu Ramadhani Profile Picture",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Rafie Restu Ramadhani — Software Developer & AI Explorer",
        description:
            "Ideas into Real Impact. Information System student at Gunadarma University, building digital products & exploring AI/IoT.",
        images: ["/assets/img/profile.jpg"],
        creator: "@rpiirmdhni",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    category: "technology",
};

const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Person",
            "@id": `${siteUrl}/#person`,
            name: "Rafie Restu Ramadhani",
            alternateName: ["rpiirmdhni", "Rafie Ramadhani"],
            url: siteUrl,
            image: `${siteUrl}/assets/img/profile.jpg`,
            jobTitle: "Founder & CEO, Software Developer",
            worksFor: {
                "@type": "Organization",
                name: "Meluna",
            },
            alumniOf: [
                {
                    "@type": "EducationalOrganization",
                    name: "Gunadarma University",
                },
                {
                    "@type": "EducationalOrganization",
                    name: "SMK Negeri 4 Kota Tangerang",
                },
            ],
            address: {
                "@type": "PostalAddress",
                addressLocality: "Tangerang",
                addressCountry: "ID",
            },
            sameAs: [
                "https://github.com/rpiirmdhni",
                "https://linkedin.com/in/rpiirmdhni",
                "mailto:rafieresturamadhani@gmail.com",
            ],
            knowsAbout: [
                "JavaScript",
                "TypeScript",
                "React",
                "Next.js",
                "Node.js",
                "PHP",
                "Laravel",
                "Python",
                "TailwindCSS",
                "IoT",
                "MQTT Broker",
                "Artificial Intelligence",
            ],
        },
        {
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            url: siteUrl,
            name: "Rafie Restu Ramadhani Portfolio",
            description: "Official Personal Portfolio of Rafie Restu Ramadhani (rpiirmdhni)",
            publisher: {
                "@id": `${siteUrl}/#person`,
            },
            inLanguage: "en-US",
        },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                {/* eslint-disable-next-line @next/next/no-page-custom-font */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
                    rel="stylesheet"
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body className="bg-olive-50 text-taupe-950 h-dvh flex flex-col overflow-hidden">
                {children}
            </body>
        </html>
    );
}
