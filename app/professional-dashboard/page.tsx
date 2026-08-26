"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";

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
};

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

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      if (!professionalId) {
        return;
      }

      const { data, error: queryError } = await supabase
        .from("service_requests")
        .select(
          "id, customer_name, customer_mobile, problem_description, country, state, district, city, area, pincode, address, preferred_time, status, created_at"
        )
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: false });

      if (cancelled) {
        return;
      }

      if (queryError) {
        console.error("Jobs load error:", queryError);
        setError(queryError.message);
      } else {
        setJobs((data || []) as ServiceRequest[]);
      }

      setLoading(false);
    }

    void loadJobs();

    return () => {
      cancelled = true;
    };
  }, [professionalId]);

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
      setError(updateError.message);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Jobs</h1>
          <p className="mt-2 text-slate-600">
            Assigned service requests ko manage karein.
          </p>
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
                  </div>

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
