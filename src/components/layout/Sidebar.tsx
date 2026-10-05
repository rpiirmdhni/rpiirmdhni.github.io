import { ArrowUpRightIcon, GithubIcon, LinkedinIcon, MailIcon, MapPinIcon } from "../icons";

type SidebarProps = {
    isOpen: boolean;
};

export default function Sidebar({ isOpen }: SidebarProps) {
    return (
        <aside
            id="sidebar"
            className={`absolute md:relative z-50 top-0 left-0 h-full w-80 md:w-85 bg-olive-50 p-6 md:p-8 flex flex-col gap-6 shrink-0 overflow-y-auto hidden-scrollbar transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 border-r border-taupe-950/15`}
        >
            <div className="relative select-none rounded-2xl overflow-hidden aspect-square w-full shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="assets/img/profile.jpg" alt="Rafie Restu Ramadhani" className="w-full h-full object-[50%_15%] object-cover" />
                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-taupe-950/20 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-taupe-950/20 to-transparent"></div>
                <ArrowUpRightIcon />
                <span className="absolute bottom-0 left-0 w-full p-4 text-white text-wrap z-10">Let&apos;s build<br />something great.</span>
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-lg md:text-2xl font-medium">Hi, I&apos;m</span>
                <h1 className="text-3xl md:text-5xl font-semibold">Rafie Restu Ramadhani</h1>
                <p className="text-sm md:text-base">Information System Student<br />@ Gunadarma University</p>
            </div>
            <hr className="border-taupe-950/15" />
            <div className="flex flex-col gap-4 text-sm md:text-base">
                <a href="mailto:rafieresturamadhani@gmail.com" className="flex items-center justify-start gap-2">
                    <MailIcon size={20} />
                    <span>rafieresturamadhani@gmail.com</span>
                </a>
                <span className="flex items-center justify-start gap-2">
                    <MapPinIcon size={20} />
                    <span>Tangerang, ID</span>
                </span>
                <a href="https://github.com/rpiirmdhni" target="_blank" className="flex items-center justify-start gap-2">
                    <GithubIcon size={20} />
                    <span>@rpiirmdhni</span>
                </a>
                <a href="https://linkedin.com/in/rpiirmdhni" target="_blank" className="flex items-center justify-start gap-2">
                    <LinkedinIcon size={20} />
                    <span>Rafie Restu Ramadhani</span>
                </a>
            </div>
            <hr className="border-taupe-950/15" />
        </aside>
    );
}
