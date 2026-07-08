import { describe, it, expect, vi, afterEach } from "vitest";
import {
  debounce,
  formatDate,
  getDisplayName,
  preferredFirst,
  personDisplayName,
} from "./utils";

describe("formatDate", () => {
  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("returns empty string for an unparseable date", () => {
    expect(formatDate("not-a-date")).toBe("");
  });

  it("formats a plain YYYY-MM-DD date without UTC day-shift", () => {
    // The bug this guards against: `new Date("2020-01-01")` parses as UTC
    // midnight, which in negative-offset timezones renders as Dec 31. The
    // plain-date branch parses as local time, so the day must not slip.
    expect(formatDate("2020-01-01")).toBe("January 1, 2020");
  });

  it("formats an ISO timestamp", () => {
    // Pin to a fixed instant; use midday UTC so no timezone flips the date.
    expect(formatDate("2021-06-15T12:00:00Z")).toBe("June 15, 2021");
  });
});

describe("getDisplayName", () => {
  it("returns 'Unknown' when user is undefined", () => {
    expect(getDisplayName(undefined)).toBe("Unknown");
  });

  it("prefers full_name from metadata", () => {
    expect(
      getDisplayName({ email: "a@b.com", user_metadata: { full_name: "Ada Lovelace" } })
    ).toBe("Ada Lovelace");
  });

  it("falls back to email when no full_name", () => {
    expect(getDisplayName({ email: "a@b.com" })).toBe("a@b.com");
  });
});

describe("preferredFirst", () => {
  it("uses the nickname when set", () => {
    expect(preferredFirst({ first_name: "Robert", nickname: "Bob" })).toBe("Bob");
  });

  it("falls back to first_name when nickname is null", () => {
    expect(preferredFirst({ first_name: "Robert", nickname: null })).toBe("Robert");
  });

  it("ignores a whitespace-only nickname", () => {
    expect(preferredFirst({ first_name: "Robert", nickname: "   " })).toBe("Robert");
  });
});

describe("personDisplayName", () => {
  it("combines preferred first name with last name", () => {
    expect(
      personDisplayName({ first_name: "Robert", last_name: "Smith", nickname: "Bob" })
    ).toBe("Bob Smith");
  });
});

describe("debounce", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("invokes the callback only once after rapid calls", () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = debounce(spy, 200);

    debounced();
    debounced();
    debounced();
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("passes the latest arguments through", () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = debounce(spy, 100);

    debounced("first");
    debounced("second");
    vi.advanceTimersByTime(100);

    expect(spy).toHaveBeenCalledWith("second");
  });
});
