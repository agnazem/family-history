export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
