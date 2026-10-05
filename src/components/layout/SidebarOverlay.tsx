import type { RefObject } from "react";

type SidebarOverlayProps = {
    ref: RefObject<HTMLDivElement | null>;
    isHidden: boolean;
    isVisible: boolean;
    onClick: () => void;
};

/** Dimmed backdrop shown behind the sidebar on mobile. */
export default function SidebarOverlay({ ref, isHidden, isVisible, onClick }: SidebarOverlayProps) {
    return (
        <div
            ref={ref}
            id="sidebar-overlay"
            className={`absolute inset-0 bg-taupe-950/20 backdrop-blur-sm z-40${isHidden ? " hidden" : ""} transition-opacity ${isVisible ? "opacity-100" : "opacity-0"}`}
            onClick={onClick}
        ></div>
    );
}
