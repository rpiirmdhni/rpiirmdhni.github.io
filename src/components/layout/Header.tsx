import type { MouseEvent } from "react";
import { navItems } from "@/data/portfolio";
import { MenuIcon } from "../icons";

const NAV_BASE = "nav-link flex-1 md:flex-none text-center border-b-2 px-2 md:px-4 py-2 md:py-5 transition duration-150 ease-in-out whitespace-nowrap text-sm md:text-base";
const NAV_ACTIVE = "border-taupe-950";
const NAV_INACTIVE = "border-transparent hover:border-taupe-950/15";

type HeaderProps = {
    activeSection: string;
    onNavClick: (event: MouseEvent<HTMLAnchorElement>, targetId: string) => void;
    onToggleSidebar: () => void;
};

export default function Header({ activeSection, onNavClick, onToggleSidebar }: HeaderProps) {
    return (
        <header className="flex-none z-50 flex flex-col md:flex-row justify-between items-center border-b border-taupe-950/15 px-4 md:px-8 pt-2 md:py-0 backdrop-blur gap-2 md:gap-0">
            <div className="flex justify-between items-center w-full md:w-auto">
                <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-3">
                    <button id="sidebar-toggle" className="md:hidden p-2 -ml-2 rounded-lg hover:bg-taupe-950/5 cursor-pointer" onClick={onToggleSidebar}>
                        <MenuIcon />
                    </button>
                    <h4 className="text-xl md:text-2xl font-medium">Rafie Restu Ramadhani</h4>
                </div>
            </div>
            <div className="flex items-center overflow-x-auto w-full md:w-auto hidden-scrollbar justify-between md:justify-end gap-0">
                {navItems.map((item) => (
                    <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`${NAV_BASE} ${activeSection === item.id ? NAV_ACTIVE : NAV_INACTIVE}`}
                        onClick={(event) => onNavClick(event, item.id)}
                    >
                        {item.label}
                    </a>
                ))}
            </div>
        </header>
    );
}
