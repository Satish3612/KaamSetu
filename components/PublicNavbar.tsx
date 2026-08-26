"use client";

import Link from "next/link";
import { useState } from "react";
import CurrentDateTime from "./CurrentDateTime";

const links = [
  ["Home", "/"],
  ["Services", "/#services"],
  ["View Professionals", "/professionals"],
  ["How It Works", "/#how-it-works"],
  ["Join as Professional", "/professional-register"],
];

export default function PublicNavbar({ showDateTime = false }: { showDateTime?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
          <span className="block text-xl font-extrabold tracking-tight text-blue-700">KaamSetu</span>
          <span className="block text-[10px] font-medium text-slate-500">Har Kaam Ka Verified Expert</span>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map(([label, href]) => (
            <Link key={label} href={href} className="text-sm font-semibold text-slate-600 transition hover:text-blue-700">
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden xl:block">{showDateTime && <CurrentDateTime />}</div>
        <button
          type="button"
          className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="my-1 block h-0.5 w-5 bg-current" />
          <span className="block h-0.5 w-5 bg-current" />
        </button>
      </div>
      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {links.map(([label, href]) => (
              <Link key={label} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700">
                {label}
              </Link>
            ))}
            {showDateTime && <div className="mt-2"><CurrentDateTime /></div>}
          </div>
        </nav>
      )}
    </header>
  );
}
