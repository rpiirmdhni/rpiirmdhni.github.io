import { GithubIcon, LinkedinIcon, MailIcon } from "../icons";
import Card from "../ui/Card";

export default function Contact() {
    return (
        <Card id="contact">
            <h4 className="text-xl md:text-2xl font-semibold">Get in Touch</h4>
            <div className="flex flex-col gap-4 text-sm md:text-base">
                <p className="text-taupe-950/80">
                    Whether you have a question, a project idea, or just want to say hi, I&apos;ll try my best to get back to you!
                </p>
                <div className="flex items-center flex-wrap gap-2 mt-2">
                    <a href="mailto:rafieresturamadhani@gmail.com" className="w-fit border border-taupe-950/15 px-6 py-2 rounded-full flex items-center justify-center gap-2 transition duration-150 hover:bg-taupe-950/5">
                        <MailIcon size={18} />
                        <span className="font-medium">Say Hello</span>
                    </a>
                    <a href="https://github.com/rpiirmdhni" target="_blank" className="border border-taupe-950/15 p-[9px] rounded-full flex items-center justify-center transition duration-150 hover:bg-taupe-950/5">
                        <GithubIcon size={18} />
                    </a>
                    <a href="https://linkedin.com/in/rpiirmdhni" target="_blank" className="border border-taupe-950/15 p-[9px] rounded-full flex items-center justify-center transition duration-150 hover:bg-taupe-950/5">
                        <LinkedinIcon size={18} />
                    </a>
                </div>
            </div>
        </Card>
    );
}
