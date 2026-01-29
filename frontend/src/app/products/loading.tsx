export default function Loading() {
    return (
        <div className="space-y-6">
            <div>
                <div className="h-6 w-40 rounded bg-muted animate-pulse" />
                <div className="mt-2 h-4 w-64 rounded bg-muted animate-pulse" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-64 rounded-xl border bg-muted animate-pulse"
                    />
                ))}
            </div>
        </div>
    );
}