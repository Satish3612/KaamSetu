export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-700">KaamSetu</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Admin sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Secure control center access.</p>
        <form action="/admin/auth" method="post" className="mt-8 space-y-5">
          <div><label className="mb-2 block text-sm font-semibold">Username</label><input name="username" required autoComplete="username" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" /></div>
          <div><label className="mb-2 block text-sm font-semibold">Password</label><input name="password" type="password" required autoComplete="current-password" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" /></div>
          <button className="w-full rounded-xl bg-blue-700 py-3 font-bold text-white hover:bg-blue-800">Sign in</button>
        </form>
      </div>
    </main>
  );
}
