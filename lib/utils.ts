export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  // ISO timestamps contain "T"; parse natively (UTC).
  // Plain "YYYY-MM-DD" dates are parsed as local time to avoid UTC day-shift.
  const date = dateStr.includes("T")
    ? new Date(dateStr)
    : (() => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      })();
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getDisplayName(
  user: { email: string; user_metadata?: { full_name?: string } } | undefined
): string {
  if (!user) return "Unknown";
  return user.user_metadata?.full_name || user.email;
}

// Returns the preferred first name — nickname if set, otherwise first_name
export function preferredFirst(person: { first_name: string; nickname?: string | null }): string {
  return person.nickname?.trim() || person.first_name;
}

// Returns the preferred full display name for a person tile or label
export function personDisplayName(person: { first_name: string; last_name: string; nickname?: string | null }): string {
  return `${preferredFirst(person)} ${person.last_name}`;
}
