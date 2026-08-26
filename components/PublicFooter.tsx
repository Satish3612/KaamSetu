import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-2 md:items-end">
        <div>
          <p className="text-xl font-bold text-white">KaamSetu</p>
          <p className="mt-1 text-sm">Har Kaam Ka Verified Expert</p>
          <p className="mt-4 text-xs text-slate-500">Powered by secure modern web technology.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm md:justify-end">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/#services" className="hover:text-white">Services</Link>
          <Link href="/professionals" className="hover:text-white">View Professionals</Link>
          <Link href="/professional-register" className="hover:text-white">Join as Professional</Link>
        </nav>
      </div>
    </footer>
  );
}
