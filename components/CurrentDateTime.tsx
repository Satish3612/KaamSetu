"use client";

import { useEffect, useState } from "react";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export default function CurrentDateTime({ dark = false }: { dark?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const initialUpdate = window.setTimeout(() => setNow(new Date()), 0);
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => { window.clearTimeout(initialUpdate); window.clearInterval(interval); };
  }, []);

  return (
    <div
      className={`min-w-52 rounded-xl border px-3 py-2 text-xs leading-5 shadow-sm ${
        dark
          ? "border-slate-700 bg-slate-800 text-slate-200"
          : "border-slate-200 bg-white text-slate-600"
      }`}
      aria-live="polite"
    >
      {now ? (
        <>
          <span className="block font-semibold">{dateFormatter.format(now)}</span>
          <span>{timeFormatter.format(now)} IST</span>
        </>
      ) : (
        <span className="block h-10 animate-pulse rounded bg-slate-200/60" />
      )}
    </div>
  );
}
