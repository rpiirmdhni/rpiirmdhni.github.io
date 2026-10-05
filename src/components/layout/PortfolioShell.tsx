"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { navItems } from "@/data/portfolio";
import Header from "./Header";
import Sidebar from "./Sidebar";
import SidebarOverlay from "./SidebarOverlay";

type PortfolioShellProps = {
    children: ReactNode;
};

/**
 * Page shell: header + sidebar + scrollable content area.
 * Ports the two vanilla-JS behaviours from index.html to React:
 *  1. Scrollspy (active nav link follows the scroll position of #scroll-area)
 *  2. Mobile sidebar toggle (slide-in sidebar + fading overlay)
 */
export default function PortfolioShell({ children }: PortfolioShellProps) {
    const scrollAreaRef = useRef<HTMLElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // ---- Scrollspy -------------------------------------------------------
    const [activeSection, setActiveSection] = useState("home");
    const isClickScrolling = useRef(false);
    const clickScrollTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea) return;

        const sections = navItems
            .map((item) => document.getElementById(item.id))
            .filter((section): section is HTMLElement => Boolean(section));

        const onScroll = () => {
            if (isClickScrolling.current) return;

            let current = "home";
            const isAtBottom = Math.ceil(scrollArea.scrollTop + scrollArea.clientHeight) >= scrollArea.scrollHeight;

            if (scrollArea.scrollTop === 0) {
                current = sections[0].getAttribute("id") ?? current;
            } else if (isAtBottom) {
                current = sections[sections.length - 1].getAttribute("id") ?? current;
            } else {
                const scrollAreaRect = scrollArea.getBoundingClientRect();
                const triggerPoint = scrollAreaRect.top + (scrollAreaRect.height * 0.3);

                sections.forEach((section) => {
                    const rect = section.getBoundingClientRect();
                    if (rect.top <= triggerPoint) {
                        current = section.getAttribute("id") ?? current;
                    }
                });
            }

            if (current) setActiveSection(current);
        };

        scrollArea.addEventListener("scroll", onScroll);
        onScroll();

        return () => {
            scrollArea.removeEventListener("scroll", onScroll);
            clearTimeout(clickScrollTimeout.current);
        };
    }, []);

    const handleNavClick = useCallback((event: MouseEvent<HTMLAnchorElement>, targetId: string) => {
        if (targetId === "home") {
            event.preventDefault();
            if (scrollAreaRef.current) scrollAreaRef.current.scrollTop = 0;
        }

        isClickScrolling.current = true;
        clearTimeout(clickScrollTimeout.current);

        setActiveSection(targetId);

        clickScrollTimeout.current = setTimeout(() => {
            isClickScrolling.current = false;
        }, 800);
    }, []);

    // ---- Sidebar toggle --------------------------------------------------
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isOverlayHidden, setIsOverlayHidden] = useState(true);
    const overlayHideTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const toggleSidebar = useCallback(() => {
        if (isSidebarOpen) {
            setIsSidebarOpen(false);
            overlayHideTimeout.current = setTimeout(() => setIsOverlayHidden(true), 300);
        } else {
            clearTimeout(overlayHideTimeout.current);
            // Un-hide the overlay first, then trigger a reflow so the opacity transition runs
            flushSync(() => setIsOverlayHidden(false));
            void overlayRef.current?.offsetWidth;
            setIsSidebarOpen(true);
        }
    }, [isSidebarOpen]);

    useEffect(() => () => clearTimeout(overlayHideTimeout.current), []);

    return (
        <>
            <Header activeSection={activeSection} onNavClick={handleNavClick} onToggleSidebar={toggleSidebar} />
            <main className="relative flex flex-1 md:divide-x divide-taupe-950/15 overflow-hidden">
                <SidebarOverlay ref={overlayRef} isHidden={isOverlayHidden} isVisible={isSidebarOpen} onClick={toggleSidebar} />
                <Sidebar isOpen={isSidebarOpen} />
                <section ref={scrollAreaRef} id="scroll-area" className="space-y-6 md:space-y-8 p-4 md:p-8 w-full h-full overflow-y-auto scroll-smooth">
                    {children}
                </section>
            </main>
        </>
    );
}
