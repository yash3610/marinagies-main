import DashboardPageSkeleton from "./DashboardPageSkeleton";

const DashboardShellSkeleton = () => (
    <div className="flex h-screen overflow-hidden bg-[#020617] text-slate-200">
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950/90 p-5 lg:block">
            <div className="h-10 w-40 animate-pulse rounded-lg bg-cyan-500/10 motion-reduce:animate-none" />
            <div className="mt-9 space-y-3">
                {[0, 1, 2, 3, 4, 5, 6].map((item) => (
                    <div
                        key={item}
                        className="h-10 animate-pulse rounded-lg bg-slate-800/70 motion-reduce:animate-none"
                    />
                ))}
            </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-6">
                <div className="h-4 w-36 animate-pulse rounded bg-slate-800 motion-reduce:animate-none" />
                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-800 motion-reduce:animate-none" />
            </header>
            <div className="flex-1 overflow-hidden p-6">
                <DashboardPageSkeleton />
            </div>
        </main>
    </div>
);

export default DashboardShellSkeleton;
