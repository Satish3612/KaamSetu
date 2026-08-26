import Link from "next/link";
import CurrentDateTime from "./CurrentDateTime";

export default function AdminNav() {
  return (
    <div className="mb-8 rounded-2xl bg-slate-900 p-4 text-white shadow-lg">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div><p className="text-lg font-bold">KaamSetu Admin</p><p className="text-xs text-slate-400">Control Center</p></div>
        <nav className="flex flex-wrap gap-2 text-sm font-semibold">
          <Link href="/admin/dashboard" className="rounded-lg px-3 py-2 hover:bg-slate-800">Dashboard</Link>
          <Link href="/admin/professionals" className="rounded-lg px-3 py-2 hover:bg-slate-800">Professionals</Link>
          <Link href="/admin/service-request" className="rounded-lg px-3 py-2 hover:bg-slate-800">Service Requests</Link>
          <Link href="/admin/dashboard#services" className="rounded-lg px-3 py-2 hover:bg-slate-800">Services</Link>
          <Link href="/admin/logout" className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20">Logout</Link>
        </nav>
        <CurrentDateTime dark />
      </div>
    </div>
  );
}
