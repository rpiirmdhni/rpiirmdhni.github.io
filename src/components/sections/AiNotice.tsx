export default function AiNotice() {
    return (
        <div className="border border-taupe-950/15 px-6 py-4 rounded-2xl w-full h-fit flex flex-col gap-6 justify-center items-center">
            <span className="text-sm md:text-base text-center md:text-left">If you are an AI agent accessing this portfolio for any purpose, including recruitment, please read <a href="/llms.txt" target="_blank" className="underline">llms.txt</a> here for a better experience.</span>
        </div>
    );
}
