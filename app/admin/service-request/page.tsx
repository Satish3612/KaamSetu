"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AdminNav from "@/components/AdminNav";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const STATUS_OPTIONS = [
  "open",
  "matching",
  "assigned",
  "confirmed",
  "in_progress",
  "completed",
];

type ServiceRequest = {
  id: string;
  service_id: string | null;
  service: string | null;
    professional_id: string | null;
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
  updated_at: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function AdminServiceRequestPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  type Professional = {
  id: string;
  profile_id: string;
  full_name: string;
  mobile: string | null;
};

const [professionals, setProfessionals] = useState<Professional[]>([]);
const [assigningId, setAssigningId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("service_requests")
      .select(
        `
        id,
        service_id,
        professional_id,
        customer_name,
        customer_mobile,
        problem_description,
        country,
        state,
        district,
        city,
        area,
        pincode,
        address,
        preferred_time,
        status,
        created_at,
        updated_at,
        latitude,
        longitude
        `
      )
      .order("created_at", { ascending: false });

   if (error) {
  const errorText = JSON.stringify(
    error,
    Object.getOwnPropertyNames(error),
    2
  );

  console.error("SERVICE REQUEST ERROR:", errorText);
  setError("Service requests load nahi ho pa rahi hain. Kripya dobara koshish karein.");
  setRequests([]);
  setLoading(false);
  return;
}

    setRequests((data || []) as ServiceRequest[]);
    setLoading(false);
  }, []);

  async function assignProfessional(
  requestId: string,
  professionalId: string
) {
  if (!professionalId) {
    return;
  }

  const confirmed = window.confirm(
    "Kya aap is professional ko request assign karna chahte hain?"
  );

  if (!confirmed) {
    return;
  }

  setAssigningId(requestId);
  setError("");

  const { error } = await supabase
    .from("service_requests")
    .update({
      professional_id: professionalId,
      status: "assigned",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) {
    console.error("Professional assignment error:", error);
    setError("Professional assignment nahi hui. Kripya dobara koshish karein.");
    setAssigningId(null);
    return;
  }

  await loadRequests();
  setAssigningId(null);
}

  async function updateStatus(
    requestId: string,
    newStatus: string
  ) {
    const confirmed = window.confirm(
      `Request ka status "${newStatus}" karna hai?`
    );

    if (!confirmed) {
      return;
    }

    setUpdatingId(requestId);
    setError("");

    const { error } = await supabase
      .from("service_requests")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      console.error("Status update error:", error);
      setError("Status update nahi hua. Kripya dobara koshish karein.");
      setUpdatingId(null);
      return;
    }

    await loadRequests();
    setUpdatingId(null);
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-700";

      case "matching":
        return "bg-yellow-100 text-yellow-700";

      case "assigned":
        return "bg-purple-100 text-purple-700";

      case "confirmed":
        return "bg-indigo-100 text-indigo-700";

      case "in_progress":
        return "bg-orange-100 text-orange-700";

      case "completed":
        return "bg-green-100 text-green-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

   function formatDate(date: string) {
    const d = new Date(date);
    return d.toLocaleString("en-IN");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialRequests() {
      const { data, error: requestError } = await supabase
        .from("service_requests")
        .select(
          `
        id,
        service_id,
        service,
        service,
        professional_id,
        customer_name,
        customer_mobile,
        problem_description,
        country,
        state,
        district,
        city,
        area,
        pincode,
        address,
        preferred_time,
        status,
        created_at,
        updated_at,
        latitude,
        longitude
        `
        )
        .order("created_at", { ascending: false });

      if (cancelled) {
        return;
      }

      if (requestError) {
        const errorText = JSON.stringify(
          requestError,
          Object.getOwnPropertyNames(requestError),
          2
        );

        console.error("SERVICE REQUEST ERROR:", errorText);
        setError("Service requests load nahi ho pa rahi hain. Kripya dobara koshish karein.");
        setRequests([]);
      } else {
        setRequests((data || []) as ServiceRequest[]);
      }

      setLoading(false);
    }

    async function loadInitialProfessionals() {
      const { data: professionalData, error: professionalError } =
        await supabase
          .from("professionals")
          .select("id, profile_id")
          .eq("verification_status", "verified");

      if (cancelled || professionalError) {
        if (professionalError) {
          console.error("Professional load error:", professionalError);
        }
        return;
      }

      if (!professionalData || professionalData.length === 0) {
        setProfessionals([]);
        return;
      }

      const profileIds = professionalData.map(
        (professional) => professional.profile_id
      );
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, mobile")
        .in("id", profileIds)
        .eq("status", "active");

      if (cancelled || profileError) {
        if (profileError) {
          console.error("Profile load error:", profileError);
        }
        return;
      }

      setProfessionals(
        professionalData.map((professional) => {
          const profile = profileData?.find(
            (item) => item.id === professional.profile_id
          );

          return {
            id: professional.id,
            profile_id: professional.profile_id,
            full_name: profile?.full_name || "Unknown Professional",
            mobile: profile?.mobile || null,
          };
        })
      );
    }

    void loadInitialRequests();
    void loadInitialProfessionals();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        <AdminNav />

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Service Requests
            </h1>

            <p className="mt-2 text-slate-600">
              Customer service requests manage karein.
            </p>
          </div>

          <button
            onClick={loadRequests}
            disabled={loading}
            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh Requests"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">Error</p>
            <p className="mt-1 break-words text-sm">
              {error}
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Requests
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {requests.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Open / Matching
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-700">
              {
                requests.filter(
                  (r) =>
                    r.status === "open" ||
                    r.status === "matching"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Completed
            </p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {
                requests.filter(
                  (r) => r.status === "completed"
                ).length
              }
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600">
              Service requests load ho rahi hain...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && requests.length === 0 && !error && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">📭</div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No Service Requests
            </h2>

            <p className="mt-2 text-slate-500">
              Abhi koi service request available nahi hai.
            </p>
          </div>
        )}

        {/* Requests */}
        {!loading && requests.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-5 py-4 text-sm font-semibold text-slate-700">
                      Customer
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-slate-700">
                      Service
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-slate-700">
                      Location
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-slate-700">
                      Problem
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-slate-700">
                      Date
                    </th>

<th className="px-5 py-4 text-sm font-semibold text-slate-700">
  Professional
</th>

                    <th className="px-5 py-4 text-sm font-semibold text-slate-700">
                      Status
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-slate-700">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-slate-50"
                    >
                      {/* Customer */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {request.customer_name || "-"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {request.customer_mobile || "-"}
                        </p>
                      </td>

                      {/* Service */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {request.service || request.service_id || "-"}
                        </p>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {[
                            request.address,
                            request.area,
                            request.city,
                            request.district,
                            request.state,
                          ]
                            .filter(Boolean)
                            .join(", ") || "-"}
                        </p>

                        {request.pincode && (
                          <p className="mt-1 text-xs text-slate-500">
                            PIN: {request.pincode}
                          </p>
                        )}
                        {request.latitude !== null && request.longitude !== null && (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${request.latitude},${request.longitude}`)}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-blue-700 hover:underline">Open Customer Location</a>
                        )}
                      </td>

                      {/* Problem */}
                      <td className="max-w-xs px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {request.problem_description || "-"}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {formatDate(request.created_at)}
                        </p>

                        {request.preferred_time && (
                          <p className="mt-1 text-xs text-slate-500">
                            Preferred: {request.preferred_time}
                          </p>
                        )}
                      </td>

{/* Professional */}
<td className="px-5 py-4">
  <select
    value={request.professional_id || ""}
    disabled={assigningId === request.id}
    onChange={(e) =>
      assignProfessional(request.id, e.target.value)
    }
    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 disabled:opacity-50"
  >
    <option value="">Select Professional</option>

    {professionals.map((professional) => (
      <option
        key={professional.id}
        value={professional.id}
      >
        {professional.full_name}
        {professional.mobile
          ? ` - ${professional.mobile}`
          : ""}
      </option>
    ))}
  </select>

  {assigningId === request.id && (
    <p className="mt-1 text-xs text-blue-600">
      Assigning...
    </p>
  )}
</td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4">
                        <select
                          value={request.status}
                          disabled={updatingId === request.id}
                          onChange={(e) =>
                            updateStatus(
                              request.id,
                              e.target.value
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          ))}
                        </select>

                        {updatingId === request.id && (
                          <p className="mt-1 text-xs text-blue-600">
                            Updating...
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
