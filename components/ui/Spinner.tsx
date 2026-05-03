export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-6 h-6 rounded-full border-2 border-accent-border border-t-accent animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
