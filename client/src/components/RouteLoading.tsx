export default function RouteLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading workspace"
      className="dev-soft-card space-y-5 p-6 sm:p-8"
    >
      <div className="h-3 w-32 animate-pulse rounded-full bg-[#13243f]/15" />
      <div className="h-12 max-w-xl animate-pulse rounded-[1rem] bg-[#13243f]/10" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-[1.4rem] border border-[#13243f]/10 bg-white/70"
          />
        ))}
      </div>
      <span className="sr-only">Loading the requested Devanomy workspace module.</span>
    </div>
  );
}
