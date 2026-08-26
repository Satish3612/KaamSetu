"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Professional = {
  id: string;
  profile_id: string | null;
  service_id: string | null;
  experience_years: number | null;
  skills: string | null;
  state: string;
  district: string;
  city: string;
  area: string | null;
  pincode: string | null;
  availability: string;
  verification_status: string;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string;
  mobile: string;
  email: string | null;
};

type Service = {
  id: string;
  name: string;
};

type PendingProfessionalsData = {
  professionals: Professional[];
  profiles: Record<string, Profile>;
  services: Record<string, Service>;
};

async function fetchPendingProfessionals(): Promise<PendingProfessionalsData> {
  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("verification_status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const professionals = (data || []) as Professional[];
  const profileIds = professionals
    .map((professional) => professional.profile_id)
    .filter(Boolean) as string[];
  const serviceIds = professionals
    .map((professional) => professional.service_id)
    .filter(Boolean) as string[];
  const profiles: Record<string, Profile> = {};
  const services: Record<string, Service> = {};

  if (profileIds.length > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, mobile, email")
      .in("id", profileIds);

    if (profileError) {
      throw profileError;
    }

    (profileData as Profile[] | null)?.forEach((profile) => {
      profiles[profile.id] = profile;
    });
  }

  if (serviceIds.length > 0) {
    const { data: serviceData, error: serviceError } = await supabase
      .from("services")
      .select("id, name")
      .in("id", serviceIds);

    if (serviceError) {
      throw serviceError;
    }

    (serviceData as Service[] | null)?.forEach((service) => {
      services[service.id] = service;
    });
  }

  return { professionals, profiles, services };
}

export default function AdminProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [services, setServices] = useState<Record<string, Service>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingProfessionalId, setUpdatingProfessionalId] = useState<
    string | null
  >(null);

  async function loadProfessionals() {
    setLoading(true);
    setMessage("");

    try {
      const data = await fetchPendingProfessionals();

      setProfessionals(data.professionals);
      setProfiles(data.profiles);
      setServices(data.services);
    } catch (error) {
      console.error(error);
      setMessage(
        `Error: ${
          error instanceof Error ? error.message : "Unable to load professionals."
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateVerification(
    professionalId: string,
    status: "verified" | "rejected"
  ) {
    const confirmMessage =
      status === "verified"
        ? "Is professional ko APPROVE karna hai?"
        : "Is professional ko REJECT karna hai?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setUpdatingProfessionalId(professionalId);
    setMessage("Updating...");

    try {
      const { data: professional, error: professionalError } = await supabase
        .from("professionals")
        .select("profile_id")
        .eq("id", professionalId)
        .single();

      if (professionalError) {
        throw new Error(professionalError.message);
      }

      if (!professional?.profile_id) {
        throw new Error("Is professional ka profile_id nahi mila.");
      }

      const profileStatus = status === "verified" ? "active" : "blocked";
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          status: profileStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", professional.profile_id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      const { error: verificationError } = await supabase
        .from("professionals")
        .update({ verification_status: status })
        .eq("id", professionalId);

      if (verificationError) {
        throw new Error(verificationError.message);
      }

      await loadProfessionals();
      setMessage(
        status === "verified"
          ? "Professional successfully approved."
          : "Professional rejected."
      );
    } catch (error) {
      console.error(error);
      setMessage(
        `Update Error: ${
          error instanceof Error ? error.message : "Unable to update professional."
        }`
      );
    } finally {
      setUpdatingProfessionalId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialProfessionals() {
      try {
        const data = await fetchPendingProfessionals();

        if (cancelled) {
          return;
        }

        setProfessionals(data.professionals);
        setProfiles(data.profiles);
        setServices(data.services);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setMessage(
            `Error: ${
              error instanceof Error
                ? error.message
                : "Unable to load professionals."
            }`
          );
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
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Professional Verification
            </h1>

            <p className="mt-1 text-slate-600">
              Pending professionals ko verify aur approve karein.
            </p>
          </div>

          <button
            onClick={loadProfessionals}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 rounded-lg bg-blue-50 p-4 text-blue-700">
            {message}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <p className="text-lg text-slate-600">
              Loading professionals...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && professionals.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <div className="mb-3 text-5xl">✓</div>

            <h2 className="text-xl font-bold text-slate-800">
              No Pending Professionals
            </h2>

            <p className="mt-2 text-slate-500">
              Abhi verification ke liye koi professional pending nahi hai.
            </p>
          </div>
        )}

        {/* Professional Cards */}
        {!loading && professionals.length > 0 && (
          <div className="grid gap-6">

            {professionals.map((professional) => {
              const profile = professional.profile_id
                ? profiles[professional.profile_id]
                : undefined;

              const service = professional.service_id
                ? services[professional.service_id]
                : undefined;

              const isUpdating = updatingProfessionalId === professional.id;

              return (
                <div
                  key={professional.id}
                  className="overflow-hidden rounded-xl bg-white shadow-md"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {profile?.full_name || "Name not available"}
                      </h2>

                      <p className="text-sm text-slate-500">
                        Registered:{" "}
                        {new Date(
                          professional.created_at
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
                      Pending Verification
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">

                    <div>
                      <p className="text-sm text-slate-500">Mobile</p>
                      <p className="font-semibold">
                        {profile?.mobile || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-semibold">
                        {profile?.email || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Service</p>
                      <p className="font-semibold">
                        {service?.name || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Experience</p>
                      <p className="font-semibold">
                        {professional.experience_years ?? 0} years
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">State</p>
                      <p className="font-semibold">
                        {professional.state || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">District</p>
                      <p className="font-semibold">
                        {professional.district || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">City</p>
                      <p className="font-semibold">
                        {professional.city || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Area</p>
                      <p className="font-semibold">
                        {professional.area || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Pincode</p>
                      <p className="font-semibold">
                        {professional.pincode || "-"}
                      </p>
                    </div>

                    <div className="md:col-span-2 lg:col-span-3">
                      <p className="text-sm text-slate-500">Skills</p>
                      <p className="font-semibold">
                        {professional.skills || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Availability</p>
                      <p className="font-semibold">
                        {professional.availability || "-"}
                      </p>
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 border-t bg-slate-50 px-6 py-5">

                    <button
                      onClick={() =>
                        updateVerification(
                          professional.id,
                          "verified"
                        )
                      }
                      disabled={isUpdating}
                      className="rounded-lg bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUpdating ? "Updating..." : "✓ Approve"}
                    </button>

                    <button
                      onClick={() =>
                        updateVerification(
                          professional.id,
                          "rejected"
                        )
                      }
                      disabled={isUpdating}
                      className="rounded-lg bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUpdating ? "Updating..." : "✕ Reject"}
                    </button>

                  </div>
                </div>
              );
            })}

          </div>
        )}

      </div>
    </main>
  );
}
