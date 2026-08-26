"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type SupabaseErrorDetails = {
  message?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
};

function formatRegistrationError(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const { message, code, details, hint } = error as SupabaseErrorDetails;
    const errorDetails = [
      typeof message === "string" && message,
      typeof code === "string" && `Code: ${code}`,
      typeof details === "string" && `Details: ${details}`,
      typeof hint === "string" && `Hint: ${hint}`,
    ].filter(Boolean);

    if (errorDetails.length > 0) {
      return errorDetails.join("\n");
    }

    try {
      return JSON.stringify(error) || "Unknown error";
    } catch {
      return "Unknown error";
    }
  }

  return "Unknown error";
}

export default function ProfessionalRegister() {
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);

  const name = String(formData.get("name") || "").trim();
  const mobile = String(formData.get("mobile") || "").trim();
  const serviceName = String(formData.get("service") || "").trim();
  const experience = String(formData.get("experience") || "").trim();
  const skills = String(formData.get("skills") || "").trim();

  const country = String(formData.get("country") || "India").trim();
  const state = String(formData.get("state") || "").trim();
  const district = String(formData.get("district") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const area = String(formData.get("area") || "").trim();
  const pincode = String(formData.get("pincode") || "").trim();
  const availability = String(
    formData.get("availability") || "Flexible"
  ).trim();

  try {
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id")
      .eq("name", serviceName)
      .maybeSingle();

    if (serviceError) throw serviceError;

    if (!service) {
      throw new Error(`Service "${serviceName}" services table mein nahi mila.`);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        full_name: name,
        mobile: mobile,
        role: "professional",
        status: "pending",
      })
      .select("id")
      .single();

    if (profileError) throw profileError;

    let experienceYears = 0;

    if (experience.includes("Less than 1")) {
      experienceYears = 0;
    } else if (experience.includes("1–3")) {
      experienceYears = 2;
    } else if (experience.includes("3–5")) {
      experienceYears = 4;
    } else if (experience.includes("5–10")) {
      experienceYears = 7;
    } else if (experience.includes("10+")) {
      experienceYears = 10;
    }

    const { error: professionalError } = await supabase
      .from("professionals")
      .insert({
        profile_id: profile.id,
        service_id: service.id,
        experience_years: experienceYears,
        skills: skills,
        country: country,
        state: state,
        district: district,
        city: city,
        area: area || null,
        pincode: pincode || null,
        availability: availability,
        verification_status: "pending",
      });

    if (professionalError) throw professionalError;

    setSubmitted(true);
  } catch (error: unknown) {
    console.error("Professional registration error:", error);

    const errorMessage = formatRegistrationError(error);

    alert(
      `Registration save nahi hui.\n\nError: ${
        errorMessage
      }`
    );
  }
}

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 text-center shadow-lg">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            Registration Received
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            Thank you for registering with KaamSetu. Your profile is currently
            under verification.
          </p>

          <div className="mt-6 rounded-2xl bg-blue-50 p-5 text-left">
            <p className="font-semibold text-blue-900">
              Verification Status
            </p>
            <p className="mt-1 text-blue-700">
              🟡 Pending Verification
            </p>
          </div>

          <Link
            href="/"
            className="mt-8 inline-block rounded-xl bg-blue-700 px-7 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Back to KaamSetu
          </Link>
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
            Join as a Professional
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Apni skills register karein aur apne area mein genuine customers
            se connect hone ka opportunity paayein.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-3xl bg-white p-6 shadow-lg sm:p-10"
        >
          {/* Personal Information */}
          <section>
            <h2 className="text-xl font-bold text-slate-900">
              1. Personal Information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Full Name *
                </label>
                <input
                  required
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Mobile Number *
                </label>
                <input
                  required
                  name="mobile"
                  type="tel"
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          {/* Professional Information */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-900">
              2. Professional Information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Main Service *
                </label>

                <select
                  required
                  name="service"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select service</option>
                  <option>Electrician</option>
                  <option>Plumber</option>
                  <option>AC / RO Repair</option>
                  <option>CCTV / Wi-Fi / Network</option>
                  <option>Computer / Mobile Repair</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Experience *
                </label>

                <select
                  required
                  name="experience"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select experience</option>
                  <option>Less than 1 year</option>
                  <option>1–3 years</option>
                  <option>3–5 years</option>
                  <option>5–10 years</option>
                  <option>10+ years</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold">
                  Skills
                </label>

                <input
                  name="skills"
                  type="text"
                  placeholder="Example: AC servicing, installation, gas charging"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-900">
              3. Service Location
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Yeh structure future mein poore India ke liye use hoga.
            </p>

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
                  Area
                </label>

                <input
                  name="area"
                  placeholder="Area / Locality"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Pincode
                </label>

                <input
                  name="pincode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit pincode"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          {/* Availability */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-900">
              4. Availability
            </h2>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold">
                When are you generally available?
              </label>

              <select
                name="availability"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option>Full Day</option>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
                <option>Flexible</option>
              </select>
            </div>
          </section>

          {/* Verification Notice */}
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-bold text-amber-900">
              🛡️ Verification
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              Registration ke baad KaamSetu team profile ko verify karegi.
              Verification complete hone ke baad hi profile ko verified
              professional ke roop mein show kiya jayega.
            </p>
          </section>

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-700 py-4 text-lg font-bold text-white transition hover:bg-blue-800"
          >
            Submit Registration
          </button>

          <p className="text-center text-xs leading-5 text-slate-500">
            By submitting this form, you agree to provide accurate information
            for professional verification.
          </p>
        </form>
      </div>
    </main>
  );
}
