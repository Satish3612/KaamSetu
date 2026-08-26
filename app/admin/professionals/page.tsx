"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AdminNav from "@/components/AdminNav";
import ProfessionalActionModal from "@/components/ProfessionalActionModal";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);

type Professional = { id: string; profile_id: string; service_id: string; experience_years: number | null; skills: string | null; state: string | null; district: string | null; city: string | null; area: string | null; pincode: string | null; verification_status: string; created_at: string };
type Profile = { id: string; full_name: string; mobile: string; status: string };
type Service = { id: string; name: string };
type Action = "approve" | "reject" | "deactivate" | "reactivate";
type PendingAction = { professional: Professional; action: Action } | null;
type SupabaseError = { code?: string; message?: string; details?: string; hint?: string };

const modalContent: Record<Action, { title: string; message: string; confirmLabel: string; tone: "warning" | "positive" }> = {
  approve: { title: "Approve Professional?", message: "This professional will be verified and eligible to appear in public listings.", confirmLabel: "Approve", tone: "positive" },
  reject: { title: "Reject Professional?", message: "This registration will be marked as rejected and the account will remain blocked.", confirmLabel: "Reject", tone: "warning" },
  deactivate: { title: "Deactivate Professional?", message: "This professional will be removed from public listings and will not receive new service requests. Existing service history will remain safe.", confirmLabel: "Deactivate Professional", tone: "warning" },
  reactivate: { title: "Reactivate Professional?", message: "This professional will become eligible to appear in public listings and receive new service requests.", confirmLabel: "Reactivate", tone: "positive" },
};

function normalizedVerification(status: string) {
  return status === "blocked" ? "verified" : status;
}

function logSupabaseError(context: string, error: SupabaseError) {
  console.error(context, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

export default function AdminProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [services, setServices] = useState<Record<string, Service>>({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await supabase.from("professionals").select("id, profile_id, service_id, experience_years, skills, state, district, city, area, pincode, verification_status, created_at").order("created_at", { ascending: false });
    if (result.error) {
      console.error("Admin professionals load error:", result.error);
      setMessage("Professionals load nahi ho pa rahe hain."); setLoading(false); return;
    }
    const rows = (result.data || []) as Professional[];
    const [profileResult, serviceResult] = await Promise.all([
      rows.length ? supabase.from("profiles").select("id, full_name, mobile, status").in("id", rows.map((professional) => professional.profile_id)) : Promise.resolve({ data: [], error: null }),
      supabase.from("services").select("id, name"),
    ]);
    if (profileResult.error || serviceResult.error) {
      console.error("Professional details load error:", profileResult.error || serviceResult.error);
      setMessage("Professional details load nahi ho pa rahi hain.");
    } else {
      setProfessionals(rows);
      setProfiles(Object.fromEntries((profileResult.data || []).map((profile) => [profile.id, profile])));
      setServices(Object.fromEntries((serviceResult.data || []).map((service) => [service.id, service])));
      setMessage("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return professionals.filter((professional) => {
      const profile = profiles[professional.profile_id];
      const verification = normalizedVerification(professional.verification_status);
      const isActiveVerified = verification === "verified" && profile?.status === "active";
      const isBlockedVerified = verification === "verified" && ["blocked", "inactive"].includes(profile?.status || "");
      const matchesFilter = filter === "all" || (filter === "verified" && isActiveVerified) || (filter === "blocked" && isBlockedVerified) || (filter === "pending" && verification === "pending") || (filter === "rejected" && verification === "rejected");
      const matchesSearch = !term || [profile?.full_name, profile?.mobile, professional.skills].some((value) => value?.toLowerCase().includes(term));
      return matchesFilter && matchesSearch;
    });
  }, [filter, professionals, profiles, search]);

  function updateLocalState(professional: Professional, verificationStatus: string, profileStatus: string) {
    setProfessionals((current) => current.map((item) => item.id === professional.id ? { ...item, verification_status: verificationStatus } : item));
    setProfiles((current) => ({ ...current, [professional.profile_id]: { ...current[professional.profile_id], status: profileStatus } }));
  }

  async function updateProfileStatus(professional: Professional, status: "active" | "blocked" | "pending") {
    return supabase.from("profiles").update({ status, updated_at: new Date().toISOString() }).eq("id", professional.profile_id);
  }

  async function updateVerificationStatus(professional: Professional, status: "verified" | "rejected") {
    return supabase.from("professionals").update({ verification_status: status, updated_at: new Date().toISOString() }).eq("id", professional.id);
  }

  async function performAction() {
    if (!pendingAction) return;
    const { professional, action } = pendingAction;
    const oldVerification = professional.verification_status;
    const oldProfileStatus = profiles[professional.profile_id]?.status || "blocked";
    setUpdatingId(professional.id); setMessage("");

    if (action === "deactivate" || action === "reactivate") {
      const profileStatus = action === "deactivate" ? "blocked" : "active";
      const profileResult = await updateProfileStatus(professional, profileStatus);
      if (profileResult.error) {
        logSupabaseError("Professional account status update error:", profileResult.error);
        setMessage("Professional account update nahi hua. Kripya dobara koshish karein.");
        setUpdatingId(null); return;
      }
      let verificationStatus = normalizedVerification(oldVerification);
      if (action === "reactivate" && oldVerification === "blocked") {
        const repairResult = await updateVerificationStatus(professional, "verified");
        if (repairResult.error) {
          logSupabaseError("Legacy professional verification repair error:", repairResult.error);
          await updateProfileStatus(professional, oldProfileStatus === "active" ? "active" : "blocked");
          setMessage("Professional account update nahi hua. Kripya dobara koshish karein.");
          setUpdatingId(null); return;
        }
        verificationStatus = "verified";
      }
      updateLocalState(professional, verificationStatus, profileStatus);
      setMessage(action === "deactivate" ? "Professional deactivated successfully." : "Professional reactivated successfully.");
    } else {
      const nextVerification = action === "approve" ? "verified" : "rejected";
      const nextProfileStatus = action === "approve" ? "active" : "blocked";
      const profileResult = await updateProfileStatus(professional, nextProfileStatus);
      if (profileResult.error) {
        logSupabaseError("Professional profile update error:", profileResult.error);
        setMessage("Professional verification update nahi hua. Kripya dobara koshish karein.");
        setUpdatingId(null); return;
      }
      const verificationResult = await updateVerificationStatus(professional, nextVerification);
      if (verificationResult.error) {
        logSupabaseError("Professional verification update error:", verificationResult.error);
        await updateProfileStatus(professional, oldProfileStatus === "active" ? "active" : oldProfileStatus === "pending" ? "pending" : "blocked");
        setMessage("Professional verification update nahi hua. Kripya dobara koshish karein.");
        setUpdatingId(null); return;
      }
      updateLocalState(professional, nextVerification, nextProfileStatus);
      setMessage(action === "approve" ? "Professional approved successfully." : "Professional rejected successfully.");
    }

    setPendingAction(null); setUpdatingId(null);
  }

  const filters = ["all", "pending", "verified", "blocked", "rejected"];
  const modal = pendingAction ? modalContent[pendingAction.action] : null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <AdminNav />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-extrabold">Professional Management</h1><p className="mt-2 text-slate-600">Verify, reject, deactivate and safely reactivate professionals.</p></div><button onClick={() => void load()} disabled={loading} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-60">{loading ? "Loading..." : "Refresh"}</button></div>
        <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm"><div className="flex flex-wrap gap-2">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${filter === item ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"}`}>{item}</button>)}</div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, mobile or skill" className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" /></div>
        {message && <div role="status" className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-700">{message}</div>}
        {!loading && filtered.length === 0 && <div className="mt-6 rounded-2xl bg-white p-10 text-center text-slate-600">No professionals match this filter.</div>}
        <div className="mt-6 grid gap-5">{filtered.map((professional) => {
          const profile = profiles[professional.profile_id];
          const service = services[professional.service_id];
          const verification = normalizedVerification(professional.verification_status);
          const isActive = profile?.status === "active";
          const busy = updatingId === professional.id;
          return <article key={professional.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold">{profile?.full_name || "Professional"}</h2><p className="text-sm text-slate-500">{profile?.mobile || "-"}</p></div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${verification === "verified" ? "bg-blue-50 text-blue-700" : verification === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{verification}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>{isActive ? "Active" : "Blocked"}</span></div></div>
            <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-slate-500">Service</dt><dd className="font-semibold">{service?.name || "-"}</dd></div><div><dt className="text-slate-500">Skills</dt><dd className="font-semibold">{professional.skills || "-"}</dd></div><div><dt className="text-slate-500">Experience</dt><dd className="font-semibold">{professional.experience_years ?? 0} years</dd></div><div><dt className="text-slate-500">Location</dt><dd className="font-semibold">{[professional.area, professional.city, professional.district, professional.state, professional.pincode].filter(Boolean).join(", ") || "-"}</dd></div><div><dt className="text-slate-500">Registration date</dt><dd className="font-semibold">{new Date(professional.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</dd></div></dl>
            <div className="flex flex-wrap gap-3 border-t bg-slate-50 p-5">{verification === "pending" && <><button disabled={busy} onClick={() => setPendingAction({ professional, action: "approve" })} className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50">Approve</button><button disabled={busy} onClick={() => setPendingAction({ professional, action: "reject" })} className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50">Reject</button></>}{verification === "verified" && isActive && <button disabled={busy} onClick={() => setPendingAction({ professional, action: "deactivate" })} className="rounded-lg bg-slate-800 px-4 py-2 font-bold text-white disabled:opacity-50">Block / Deactivate</button>}{verification === "verified" && !isActive && <button disabled={busy} onClick={() => setPendingAction({ professional, action: "reactivate" })} className="rounded-lg bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50">Reactivate</button>}</div>
          </article>;
        })}</div>
      </div>
      <ProfessionalActionModal open={Boolean(pendingAction && modal)} title={modal?.title || ""} message={modal?.message || ""} confirmLabel={modal?.confirmLabel || "Confirm"} tone={modal?.tone} loading={Boolean(pendingAction && updatingId === pendingAction.professional.id)} onCancel={() => { if (!updatingId) setPendingAction(null); }} onConfirm={() => void performAction()} />
    </main>
  );
}
