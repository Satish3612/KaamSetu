"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function ServiceRequest() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedServiceName, setSelectedServiceName] = useState("");
  const [selectedProfessionalName, setSelectedProfessionalName] = useState("");
  const [selectionLoading, setSelectionLoading] = useState(true);
  const [selectionError, setSelectionError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const searchParams = new URLSearchParams(window.location.search);
    const professionalId =
      searchParams.get("professionalId") ||
      window.sessionStorage.getItem("selectedProfessionalId") ||
      "";
    const serviceId =
      searchParams.get("serviceId") ||
      window.sessionStorage.getItem("selectedServiceId") ||
      "";

    async function loadSelectedService() {
      setSelectedProfessionalId(professionalId);
      setSelectedServiceId(serviceId);
      setSelectedProfessionalName(searchParams.get("professionalName") || "");

      if (!professionalId || !serviceId) {
        setSelectionError("Please select a service first.");
        setSelectionLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("services")
        .select("name")
        .eq("id", serviceId)
        .eq("status", "active")
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Unable to load selected service:", error);
        setSelectionError("Selected service load nahi ho pa rahi hai. Please select again.");
      } else if (!data) {
        setSelectionError("Selected service is no longer available. Please select again.");
      } else {
        setSelectedServiceName(data.name);
      }

      setSelectionLoading(false);
    }

    void loadSelectedService();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);

  // Check: professional selected hai ya nahi
  if (!selectedProfessionalId) {
    alert("Professional ID nahi mili. Please professional ko dobara select karein.");
    return;
  }

  // Check: service selected hai ya nahi
  if (!selectedServiceId) {
    alert("Please select a service first.");
    return;
  }

  if (!selectedServiceName || selectionError) {
    alert(selectionError || "Selected service load nahi hui. Please select again.");
    return;
  }

  const { data: professional, error: professionalError } = await supabase
    .from("professionals")
    .select("id")
    .eq("id", selectedProfessionalId)
    .eq("service_id", selectedServiceId)
    .eq("verification_status", "verified")
    .maybeSingle();

  if (professionalError) {
    console.error("Professional verification error:", professionalError);
    alert(`Professional verification failed: ${professionalError.message}`);
    return;
  }

  if (!professional) {
    alert("Selected professional is no longer available. Please select again.");
    return;
  }

  const { error } = await supabase
    .from("service_requests")
    .insert({
      // Selected professional
      professional_id: selectedProfessionalId,

      // Selected service UUID
      service_id: selectedServiceId,

      // Customer details
      name: formData.get("name") as string,
      customer_name: formData.get("name") as string,

      mobile: formData.get("mobile") as string,
      customer_mobile: formData.get("mobile") as string,

      // Service
      service: selectedServiceName,

      // Problem
      problem: formData.get("problem") as string,
      problem_description: formData.get("problem") as string,

      // Location
      country: formData.get("country") as string,
      state: formData.get("state") as string,
      district: formData.get("district") as string,
      city: formData.get("city") as string,
      area: formData.get("area") as string,
      pincode: formData.get("pincode") as string,
      address: formData.get("address") as string,

      // Preferred time
      preferred_time: formData.get("preferredTime") as string,

      // Initial request status
      status: "open",
    });

  if (error) {
    console.error("Supabase error:", error);
    alert(`Supabase Error: ${error.message}`);
    return;
  }

  console.log("Service request created successfully");

  setSubmitted(true);
}

  

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 text-center shadow-lg">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-700">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            Service Request Received
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            Aapki service request KaamSetu ko mil gayi hai.
            Hum aapke area mein available verified professionals
            identify karenge.
          </p>

          <div className="mt-6 rounded-2xl bg-blue-50 p-5 text-left">
            <p className="font-semibold text-blue-900">
              Request Status
            </p>

            <p className="mt-1 text-blue-700">
              🟡 Finding Verified Professionals
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-xl bg-blue-700 px-7 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Back to KaamSetu
            </Link>

            <button
              onClick={() => setSubmitted(false)}
              className="rounded-xl border border-slate-300 px-7 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              New Request
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-bold text-blue-700"
          >
            KaamSetu
          </Link>

          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            Book a Service
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Apni problem batayein. KaamSetu aapko suitable
            verified professional se connect karne mein help karega.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-3xl bg-white p-6 shadow-lg sm:p-10"
        >

          {/* Customer Information */}
          <section>
            <h2 className="text-xl font-bold text-slate-900">
              1. Your Information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Full Name *
                </label>

                <input
                  required
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Mobile Number *
                </label>

                <input
                  required
                  type="tel"
                  name="mobile"
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>
          </section>

          {/* Service */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-900">
              2. Select Service
            </h2>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold">
                Service Required *
              </label>

              <input
                readOnly
                name="service"
                value={selectionLoading ? "Service load ho rahi hai..." : selectedServiceName}
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-700"
              />
              {selectedProfessionalName && (
                <p className="mt-2 text-sm text-slate-500">
                  Selected professional: {selectedProfessionalName}
                </p>
              )}
              {selectionError && (
                <p className="mt-2 text-sm text-red-700">{selectionError}</p>
              )}
            </div>
          </section>

          {/* Problem */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-900">
              3. Tell Us About Your Problem
            </h2>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold">
                Problem Description *
              </label>

              <textarea
                required
                name="problem"
                rows={5}
                placeholder="Example: Mere AC se cooling nahi ho rahi hai..."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Jitni clear information denge, utna better professional
                matching ho sakega.
              </p>
            </div>
          </section>

          {/* Location */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-900">
              4. Service Location
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Country
                </label>

                <select
                  name="country"
                  defaultValue="India"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                >
                  <option>India</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  State *
                </label>

                <select
                  required
                  name="state"
                  defaultValue="Uttar Pradesh"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                >
                  <option>Uttar Pradesh</option>
                  <option>Delhi</option>
                  <option>Maharashtra</option>
                  <option>Rajasthan</option>
                  <option>Madhya Pradesh</option>
                  <option>Bihar</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  District *
                </label>

                <input
                  required
                  name="district"
                  defaultValue="Hardoi"
                  placeholder="District"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  City / Town *
                </label>

                <input
                  required
                  name="city"
                  placeholder="City / Town"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Area / Locality *
                </label>

                <input
                  required
                  name="area"
                  placeholder="Example: Railway Ganj"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Pincode *
                </label>

                <input
                  required
                  name="pincode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="6-digit pincode"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold">
                Complete Address *
              </label>

              <textarea
                required
                name="address"
                rows={3}
                placeholder="House / Shop / Building address"
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </section>

          {/* Time */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-900">
              5. Preferred Time
            </h2>

            <div className="mt-5">
              <select
                required
                name="preferredTime"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="">Select preferred time</option>
                <option>As Soon As Possible</option>
                <option>Today</option>
                <option>Tomorrow</option>
                <option>Within 2–3 Days</option>
              </select>
            </div>
          </section>

          {/* Photo */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-900">
              6. Problem Photo
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Optional — problem ki photo professional ko issue samajhne
              mein help kar sakti hai.
            </p>

            <input
              type="file"
              accept="image/*"
              className="mt-4 block w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
            />
          </section>

          {/* AI Notice */}
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <h2 className="font-bold text-blue-900">
              🤖 Smart Professional Matching
            </h2>

            <p className="mt-2 text-sm leading-6 text-blue-800">
              Future version mein KaamSetu aapki problem, location,
              professional skills, availability aur ratings ke basis par
              suitable professionals recommend karega.
            </p>
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={selectionLoading || Boolean(selectionError)}
            className="w-full rounded-xl bg-blue-700 py-4 text-lg font-bold text-white transition hover:bg-blue-800"
          >
            Find Verified Expert
          </button>

          <p className="text-center text-xs leading-5 text-slate-500">
            KaamSetu pilot currently Hardoi District mein testing phase mein hai.
          </p>
        </form>
      </div>
    </main>
  );
}
