export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="h-7 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-72 rounded bg-muted animate-pulse" />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="h-40 rounded-xl border bg-muted animate-pulse lg:col-span-1" />
                <div className="space-y-3 lg:col-span-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-xl border bg-muted animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}