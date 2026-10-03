const PulseBlock = ({ className = "" }) => (
    <div className={`animate-pulse rounded-lg bg-slate-800/80 motion-reduce:animate-none ${className}`} />
);

const DashboardPageSkeleton = () => (
    <div
        className="space-y-5 pb-6"
        role="status"
        aria-live="polite"
        aria-label="Loading dashboard page"
    >
        <span className="sr-only">Loading dashboard page...</span>

        <div className="flex items-center justify-between gap-4">
            <div className="space-y-3">
                <PulseBlock className="h-6 w-48" />
                <PulseBlock className="h-3 w-72 max-w-[70vw]" />
            </div>
            <PulseBlock className="hidden h-9 w-32 sm:block" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
                <div key={item} className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                    <div className="flex items-center justify-between">
                        <PulseBlock className="h-10 w-10" />
                        <PulseBlock className="h-3 w-16" />
                    </div>
                    <PulseBlock className="mt-5 h-7 w-20" />
                    <PulseBlock className="mt-3 h-3 w-28" />
                </div>
            ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 xl:col-span-2">
                <PulseBlock className="h-4 w-40" />
                <PulseBlock className="mt-5 h-64 w-full" />
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                <PulseBlock className="h-4 w-36" />
                <div className="mt-5 space-y-4">
                    {[0, 1, 2, 3].map((item) => (
                        <div key={item} className="flex items-center gap-3">
                            <PulseBlock className="h-9 w-9 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <PulseBlock className="h-3 w-3/4" />
                                <PulseBlock className="h-2.5 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export default DashboardPageSkeleton;
