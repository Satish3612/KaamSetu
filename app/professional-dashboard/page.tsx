"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import CurrentDateTime from "@/components/CurrentDateTime";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type JobStatus = "assigned" | "in_progress" | "completed";

type ServiceRequest = {
  id: string;
  customer_name: string | null;
  customer_mobile: string | null;
  problem_description: string | null;
  service: string | null;
  country: string | null;
  state: string | null;
  district: string | null;
  city: string | null;
  area: string | null;
  pincode: string | null;
  address: string | null;
  preferred_time: string | null;
  status: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
};

const JOB_COLUMNS = "id, customer_name, customer_mobile, service, problem_description, country, state, district, city, area, pincode, address, preferred_time, status, created_at";

async function fetchJobs(professionalId: string) {
  const locationResult = await supabase
    .from("service_requests")
    .select(`${JOB_COLUMNS}, latitude, longitude`)
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });

  if (locationResult.error?.code !== "42703" ||
      !/service_requests\.(latitude|longitude)/.test(locationResult.error.message)) {
    return locationResult;
  }

  console.error("Optional customer location columns unavailable:", {
    code: locationResult.error.code,
    message: locationResult.error.message,
    details: locationResult.error.details,
    hint: locationResult.error.hint,
  });

  const legacyResult = await supabase
    .from("service_requests")
    .select(JOB_COLUMNS)
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });

  return {
    ...legacyResult,
    data: legacyResult.data?.map((job) => ({
      ...job,
      latitude: null,
      longitude: null,
    })),
  };
}

const nextStatus: Partial<Record<JobStatus, JobStatus>> = {
  assigned: "in_progress",
  in_progress: "completed",
};

function getLocation(request: ServiceRequest) {
  return [
    request.address,
    request.area,
    request.city,
    request.district,
    request.state,
    request.country,
    request.pincode,
  ]
    .filter(Boolean)
    .join(", ") || "-";
}

function ProfessionalDashboardContent() {
  const searchParams = useSearchParams();
  const professionalId = searchParams.get("professionalId");
  const [jobs, setJobs] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [locationUpdatedAt, setLocationUpdatedAt] = useState<string | null>(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      if (!professionalId) {
        return;
      }

      const { data, error: queryError } = await fetchJobs(professionalId);

      const { data: professionalLocation, error: professionalLocationError } = await supabase
        .from("professionals")
        .select("location_updated_at")
        .eq("id", professionalId)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (queryError) {
        console.error("Jobs load error:", queryError);
        setError("Jobs load nahi ho pa rahe hain. Kripya dobara koshish karein.");
      } else {
        setJobs((data || []) as ServiceRequest[]);
      }
      if (professionalLocationError) {
        console.error("Professional location timestamp load error:", professionalLocationError);
      } else {
        setLocationUpdatedAt(professionalLocation?.location_updated_at || null);
      }

      setLoading(false);
    }

    void loadJobs();

    return () => {
      cancelled = true;
    };
  }, [professionalId]);

  function updateCurrentLocation() {
    if (!professionalId || !("geolocation" in navigator)) {
      setLocationMessage("Location access available nahi hai."); return;
    }
    setUpdatingLocation(true); setLocationMessage("Getting your location...");
    navigator.geolocation.getCurrentPosition(async (position) => {
      const updatedAt = new Date().toISOString();
      const { error: locationError } = await supabase.from("professionals").update({ current_latitude: position.coords.latitude, current_longitude: position.coords.longitude, location_updated_at: updatedAt }).eq("id", professionalId);
      if (locationError) {
        console.error("Professional location update error:", locationError);
        setLocationMessage("Location save nahi hui. Admin ko location migration run karni hogi.");
      } else {
        setLocationUpdatedAt(updatedAt); setLocationMessage("Current location updated successfully.");
      }
      setUpdatingLocation(false);
    }, () => { setLocationMessage("Location access nahi mili. Browser permission check karein."); setUpdatingLocation(false); }, { enableHighAccuracy: true, timeout: 15_000 });
  }

  async function updateJobStatus(job: ServiceRequest) {
    const status = job.status as JobStatus;
    const newStatus = nextStatus[status];

    if (!professionalId || !newStatus) {
      return;
    }

    setUpdatingJobId(job.id);
    setError("");

    const { error: updateError } = await supabase
      .from("service_requests")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .eq("professional_id", professionalId)
      .eq("status", status);

    if (updateError) {
      console.error("Job status update error:", updateError);
      setError("Job status update nahi hua. Kripya dobara koshish karein.");
      setUpdatingJobId(null);
      return;
    }

    setJobs((currentJobs) =>
      currentJobs.map((currentJob) =>
        currentJob.id === job.id
          ? { ...currentJob, status: newStatus }
          : currentJob
      )
    );
    setUpdatingJobId(null);
  }

  if (!professionalId) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-10 text-center shadow">
          <h1 className="text-2xl font-bold text-slate-900">
            Professional Dashboard
          </h1>
          <p className="mt-3 text-slate-600">
            Professional ID nahi mili. Please apna dashboard link dobara kholen.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><h1 className="text-3xl font-bold text-slate-900">My Jobs</h1>
          <p className="mt-2 text-slate-600">
            Assigned service requests ko manage karein.
          </p></div><CurrentDateTime />
        </div>

        <div className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Update My Current Location</h2><p className="mt-1 text-sm text-slate-500">Manual one-time update only. Continuous tracking is not used.</p></div><button type="button" onClick={updateCurrentLocation} disabled={updatingLocation} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60">{updatingLocation ? "Updating..." : "Update My Current Location"}</button></div>
          {locationMessage && <p className="mt-3 text-sm text-blue-700">{locationMessage}</p>}
          {locationUpdatedAt && <p className="mt-1 text-xs text-slate-500">Location last updated: {new Date(locationUpdatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl bg-white p-10 text-center shadow">
            <p className="text-slate-600">Jobs load ho rahe hain...</p>
          </div>
        )}

        {!loading && jobs.length === 0 && !error && (
          <div className="rounded-2xl bg-white p-10 text-center shadow">
            <h2 className="text-xl font-bold text-slate-800">No Jobs Yet</h2>
            <p className="mt-2 text-slate-500">
              Abhi aapko koi service request assign nahi hui hai.
            </p>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="grid gap-6">
            {jobs.map((job) => {
              const status = job.status as JobStatus;
              const newStatus = nextStatus[status];
              const isUpdating = updatingJobId === job.id;

              return (
                <article
                  key={job.id}
                  className="rounded-2xl bg-white p-6 shadow-md"
                >
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {job.customer_name || "Customer"}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {job.customer_mobile || "Mobile not available"}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold capitalize text-blue-700">
                      {job.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="grid gap-5 pt-5 md:grid-cols-2">
                    <div><p className="text-sm text-slate-500">Service</p><p className="mt-1 font-semibold text-slate-800">{job.service || "-"}</p></div>
                    <div>
                      <p className="text-sm text-slate-500">Problem</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {job.problem_description || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Preferred time</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {job.preferred_time || "-"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-slate-500">Location / address</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {getLocation(job)}
                      </p>
                    </div>
                    <div><p className="text-sm text-slate-500">Pincode</p><p className="mt-1 font-semibold text-slate-800">{job.pincode || "-"}</p></div>
                  </div>

                  {job.latitude !== null && job.longitude !== null ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${job.latitude},${job.longitude}`)}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 font-bold text-blue-700 hover:bg-blue-100">Navigate to Customer</a> : <p className="mt-5 text-sm font-medium text-amber-700">GPS location not provided — use customer address.</p>}

                  {newStatus && (
                    <button
                      type="button"
                      onClick={() => updateJobStatus(job)}
                      disabled={isUpdating}
                      className="mt-6 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUpdating
                        ? "Updating..."
                        : `Mark as ${newStatus.replace("_", " ")}`}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function DashboardFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Jobs</h1>
          <p className="mt-2 text-slate-600">Jobs load ho rahe hain...</p>
        </div>
      </div>
    </main>
  );
}

export default function ProfessionalDashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <ProfessionalDashboardContent />
    </Suspense>
  );
}
