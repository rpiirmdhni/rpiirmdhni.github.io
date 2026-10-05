export default function Hero() {
    return (
        <div id="home" className="relative overflow-hidden rounded-4xl bg-[#5B8CFF] p-6 md:p-8 text-white">
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-3 text-xs font-medium tracking-[0.16em] text-white/80">
                    <span className="h-px w-8 bg-white/80"></span>
                    <span>PORTFOLIO</span>
                </div>
                <div className="flex flex-col gap-4">
                    <span className="text-4xl/tight md:text-6xl/18 font-bold">
                        Ideas into<br />
                        Real Impact
                    </span>
                    <span className="text-lg md:text-xl text-white/85">I build digital products, explore AI, and create things that matter for the next generation.</span>
                </div>
            </div>
        </div>
    );
}
