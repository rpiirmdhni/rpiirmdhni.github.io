import PortfolioShell from "@/components/layout/PortfolioShell";
import AboutMe from "@/components/sections/AboutMe";
import AiNotice from "@/components/sections/AiNotice";
import Contact from "@/components/sections/Contact";
import Educations from "@/components/sections/Educations";
import Experiences from "@/components/sections/Experiences";
import FeaturedProjects from "@/components/sections/FeaturedProjects";
import Hero from "@/components/sections/Hero";
import Languages from "@/components/sections/Languages";
import Skills from "@/components/sections/Skills";

export default function Home() {
    return (
        <PortfolioShell>
            <AiNotice />
            <Hero />
            <div className="flex flex-col xl:flex-row gap-4 md:gap-6 w-full">
                <div className="flex flex-col gap-4 md:gap-6 w-full min-w-0">
                    <AboutMe />
                    <FeaturedProjects />
                    <div className="flex flex-col lg:flex-row items-start gap-4 md:gap-6 w-full">
                        <Experiences />
                        <div className="flex flex-col w-full h-fit gap-4 md:gap-6">
                            <Educations />
                            <Languages />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4 md:gap-6 w-full xl:w-xl shrink-0">
                    <Skills />
                    <Contact />
                </div>
            </div>
        </PortfolioShell>
    );
}
