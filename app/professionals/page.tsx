"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Professional = {
  id: string;
  full_name: string;
  mobile: string;
  status: string;
  service_id: string | null;
  experience_years: number | null;
  skills: string | null;
  state: string | null;
  district: string | null;
  city: string | null;
  area: string | null;
  pincode: string | null;
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to load professionals.";
}

async function fetchActiveProfessionals(): Promise<Professional[]> {
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, mobile, status")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (profileError) {
    throw profileError;
  }

  if (!profiles || profiles.length === 0) {
    return [];
  }

  const profileIds = profiles.map((profile) => profile.id);
  const { data: professionalData, error: professionalError } = await supabase
    .from("professionals")
    .select(
      `
          id,
          profile_id,
          service_id,
          experience_years,
          skills,
          state,
          district,
          city,
          area,
          pincode
        `
    )
    .in("profile_id", profileIds);

  if (professionalError) {
    throw professionalError;
  }

  return profiles.flatMap((profile) => {
    const professional = professionalData?.find(
      (item) => item.profile_id === profile.id
    );

    if (!professional) {
      return [];
    }

    return [{
      id: professional.id,
      full_name: profile.full_name,
      mobile: profile.mobile,
      status: profile.status,
      service_id: professional.service_id ?? null,
      experience_years: professional.experience_years ?? null,
      skills: professional.skills ?? null,
      state: professional.state ?? null,
      district: professional.district ?? null,
      city: professional.city ?? null,
      area: professional.area ?? null,
      pincode: professional.pincode ?? null,
    }];
  });
}

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function loadInitialProfessionals() {
      try {
        const data = await fetchActiveProfessionals();

        if (!cancelled) {
          setProfessionals(data);
        }
      } catch (fetchError) {
        if (!cancelled) {
          console.error(fetchError);
          setError(getErrorMessage(fetchError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialProfessionals();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Verified Professionals
          </h1>

          <p className="mt-2 text-slate-600">
            KaamSetu par available verified professionals
          </p>
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            <p className="text-slate-600">
              Professionals load ho rahe hain...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && professionals.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <div className="mb-3 text-4xl">👨‍🔧</div>

            <h2 className="text-xl font-semibold text-slate-900">
              No Verified Professionals
            </h2>

            <p className="mt-2 text-slate-600">
              Abhi koi active professional available nahi hai.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {professionals.map((professional) => (
            <div
              key={professional.id}
              className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg"
            >

              <div className="mb-4 flex items-start justify-between">

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {professional.full_name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    📱 {professional.mobile}
                  </p>
                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  ✓ Verified
                </span>

              </div>

              <div className="space-y-2 text-sm text-slate-700">

                <p>
                  <strong>Experience:</strong>{" "}
                  {professional.experience_years ?? 0} years
                </p>

                <p>
                  <strong>Skills:</strong>{" "}
                  {professional.skills || "Not specified"}
                </p>

                <p>
                  <strong>Location:</strong>{" "}
                  {[
                    professional.area,
                    professional.city,
                    professional.district,
                    professional.state,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Not specified"}
                </p>

                {professional.pincode && (
                  <p>
                    <strong>Pincode:</strong>{" "}
                    {professional.pincode}
                  </p>
                )}

              </div>

              <button
  className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
  onClick={() =>
    {
      window.sessionStorage.setItem(
        "selectedProfessionalId",
        professional.id
      );
      window.sessionStorage.setItem(
        "selectedServiceId",
        professional.service_id || ""
      );
      router.push(
        `/service-request?professionalId=${professional.id}&professionalName=${encodeURIComponent(
          professional.full_name
        )}&serviceId=${professional.service_id || ""}`
      );
    }
  }
>
  Request Service
</button>

            </div>
          ))}

        </div>

      </div>
    </main>
  );
}
