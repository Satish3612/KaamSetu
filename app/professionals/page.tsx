"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import PublicFooter from "@/components/PublicFooter";
import PublicNavbar from "@/components/PublicNavbar";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
type Service = { id: string; name: string; category: string | null };
type ProfessionalRow = { id: string; profile_id: string; service_id: string; experience_years: number | null; skills: string | null; state: string | null; district: string | null; city: string | null; area: string | null; pincode: string | null };
type Professional = ProfessionalRow & { full_name: string; mobile: string; service_name: string; service_category: string | null };

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const initialServiceId = new URLSearchParams(window.location.search).get("serviceId") || "";
    async function load() {
      const [serviceResult, professionalResult] = await Promise.all([
        supabase.from("services").select("id, name, category").eq("status", "active").order("name"),
        supabase.from("professionals").select("id, profile_id, service_id, experience_years, skills, state, district, city, area, pincode").eq("verification_status", "verified"),
      ]);
      if (cancelled) return;
      if (serviceResult.error || professionalResult.error) {
        console.error("Professionals load error:", serviceResult.error || professionalResult.error);
        setError("Professionals load nahi ho pa rahe hain. Kripya dobara koshish karein."); setLoading(false); return;
      }
      const rows = (professionalResult.data || []) as ProfessionalRow[];
      const profileIds = rows.map((item) => item.profile_id);
      const profileResult = profileIds.length ? await supabase.from("profiles").select("id, full_name, mobile").in("id", profileIds).eq("status", "active") : { data: [], error: null };
      if (cancelled) return;
      if (profileResult.error) {
        console.error("Professional profiles load error:", profileResult.error); setError("Professionals load nahi ho pa rahe hain. Kripya dobara koshish karein.");
      } else {
        const activeServices = (serviceResult.data || []) as Service[];
        setServices(activeServices); setServiceId(activeServices.some((item) => item.id === initialServiceId) ? initialServiceId : "");
        setProfessionals(rows.flatMap((row) => {
          const profile = profileResult.data?.find((item) => item.id === row.profile_id); const service = activeServices.find((item) => item.id === row.service_id);
          return profile && service ? [{ ...row, full_name: profile.full_name, mobile: profile.mobile, service_name: service.name, service_category: service.category }] : [];
        }));
      }
      setLoading(false);
    }
    void load(); return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return professionals.filter((professional) => (!serviceId || professional.service_id === serviceId) && (!term || [professional.service_name, professional.service_category, professional.skills, professional.area, professional.city, professional.district, professional.state].some((value) => value?.toLowerCase().includes(term))));
  }, [professionals, search, serviceId]);

  function requestService(professional: Professional) {
    const params = new URLSearchParams({ professionalId: professional.id, professionalName: professional.full_name, serviceId: professional.service_id });
    window.sessionStorage.setItem("selectedProfessionalId", professional.id); window.sessionStorage.setItem("selectedServiceId", professional.service_id); router.push(`/service-request?${params.toString()}`);
  }

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <PublicNavbar />
    <section className="border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 px-4 py-12 sm:px-6"><div className="mx-auto max-w-7xl"><p className="text-sm font-bold uppercase tracking-widest text-blue-700">Trusted local expertise</p><h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Verified Professionals</h1><p className="mt-3 max-w-2xl text-slate-600">Service, skill ya location ke hisaab se verified professional choose karein.</p></div></section>
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[280px_1fr]">
        <select value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600" aria-label="Filter by service"><option value="">All services</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search skill, service, area or city" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" />
      </div>
      {loading && <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm"><p className="animate-pulse text-slate-500">Verified professionals load ho rahe hain...</p></div>}
      {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>}
      {!loading && !error && filtered.length === 0 && <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"><div className="text-4xl">{"\u{1F50E}"}</div><h2 className="mt-4 text-xl font-bold">No verified professionals are currently available for this service.</h2><p className="mt-2 text-slate-500">Please try another service or location.</p></div>}
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{filtered.map((professional) => <article key={professional.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{professional.full_name}</h2><p className="mt-1 text-sm font-semibold text-blue-700">{professional.service_name}</p>{professional.service_category && <p className="text-xs text-slate-500">{professional.service_category}</p>}</div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">✓ Verified</span></div>
        <dl className="mt-5 space-y-3 text-sm"><div><dt className="text-slate-500">Contact</dt><dd className="font-semibold">{professional.mobile}</dd></div><div><dt className="text-slate-500">Skills</dt><dd className="font-semibold">{professional.skills || "Not specified"}</dd></div><div><dt className="text-slate-500">Experience</dt><dd className="font-semibold">{professional.experience_years ?? 0} years</dd></div><div><dt className="text-slate-500">Location</dt><dd className="font-semibold">{[professional.area, professional.city, professional.district, professional.state].filter(Boolean).join(", ") || "Not specified"}{professional.pincode ? ` - ${professional.pincode}` : ""}</dd></div></dl>
        <button type="button" onClick={() => requestService(professional)} className="mt-6 w-full rounded-xl bg-blue-700 px-4 py-3 font-bold text-white shadow-md shadow-blue-700/15 hover:bg-blue-800">Request Service</button>
      </article>)}</div>
    </section><PublicFooter />
  </main>;
}
