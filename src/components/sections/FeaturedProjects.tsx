"use client";

import { useEffect, useRef } from "react";
import Splide from "@splidejs/splide";
import { projects } from "@/data/portfolio";
import Card from "../ui/Card";
import ProjectSlide from "./ProjectSlide";

export default function FeaturedProjects() {
    const sliderRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!sliderRef.current) return;

        // Same options as the original index.html
        const splide = new Splide(sliderRef.current, {
            type: "loop",
            perPage: 1,
            autoplay: true,
            pauseOnHover: false,
            arrows: false,
            pagination: false,
        });

        // Updates the bar width whenever the carousel moves:
        splide.on("mounted move", () => {
            if (!barRef.current) return;
            const end = splide.Components.Controller.getEnd() + 1;
            const rate = Math.min((splide.index + 1) / end, 1);
            barRef.current.style.width = String(100 * rate) + "%";
        });

        splide.mount();

        return () => {
            splide.destroy();
        };
    }, []);

    return (
        <Card id="projects">
            <h3 className="text-2xl md:text-3xl font-semibold">Featured Projects</h3>
            <div className="splide" id="featured-projects-slider" ref={sliderRef}>
                <div className="splide__track">
                    <ul className="splide__list">
                        {projects.map((project) => (
                            <ProjectSlide key={project.title} project={project} />
                        ))}
                    </ul>
                </div>
                <div className="splide__progress bg-taupe-950/15 h-1 rounded-full mt-6 overflow-hidden">
                    <div ref={barRef} className="splide__progress__bar h-full transition-all duration-500 ease-out" style={{ width: "0%", backgroundColor: "#5B8CFF" }}></div>
                </div>
            </div>
        </Card>
    );
}
