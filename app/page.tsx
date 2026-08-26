"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

const serviceCards = [
  {
    icon: "⚡",
    name: "Electrician",
    description: "Wiring, fan, switch & electrical work",
  },
  {
    icon: "🚰",
    name: "Plumber",
    description: "Tap, pipe, leakage & plumbing work",
  },
  {
    icon: "❄️",
    name: "AC / RO Repair",
    description: "Repair, service & installation",
  },
  {
    icon: "📹",
    name: "CCTV / Wi-Fi",
    description: "CCTV, router & network solutions",
  },
  {
    icon: "💻",
    name: "Computer / Mobile",
    description: "Repair, setup & technical support",
  },
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Service = {
  id: string;
  name: string;
  description: string | null;
};

const trustPoints = [
  "Verified Professionals",
  "Transparent Service",
  "Customer Reviews",
  "Local Support",
];

export default function Home() {
  const [activeServices, setActiveServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, description")
        .eq("status", "active")
        .order("name");

      if (cancelled) return;

      if (error) {
        console.error("Unable to load active services:", error);
        setServicesError("Services load nahi ho pa rahi hain. Kripya dobara koshish karein.");
      } else {
        setActiveServices(data ?? []);
      }

      setServicesLoading(false);
    }

    void loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

  function findExperts(serviceId = selectedServiceId) {
    if (!serviceId) {
      alert("Please select a service first.");
      return;
    }

    router.push(`/professionals?serviceId=${encodeURIComponent(serviceId)}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-2xl font-bold tracking-tight text-blue-700">
              KaamSetu
            </div>
            <div className="text-xs text-slate-500">
              Har Kaam Ka Verified Expert
            </div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#services" className="text-sm font-medium hover:text-blue-700">
              Services
            </a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-blue-700">
              How It Works
            </a>
            <a href="#trust" className="text-sm font-medium hover:text-blue-700">
              Why KaamSetu
            </a>
          </nav>

          <Link
            href="/professional-register"
            className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Join as Professional
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm">
              📍 Currently serving Hardoi District
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Ghar ke har kaam ke liye
              <span className="block text-blue-700">
                trusted professional.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              KaamSetu aapko aapke area ke verified service professionals se
              connect karta hai — simple, reliable aur convenient.
            </p>

            {/* Search Box */}
            <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex flex-1 items-center rounded-xl border border-slate-200 px-4">
                  <span className="mr-3 text-xl">🔍</span>
                  <select
                    value={selectedServiceId}
                    onChange={(event) => setSelectedServiceId(event.target.value)}
                    disabled={servicesLoading}
                    className="w-full bg-transparent py-4 outline-none placeholder:text-slate-400"
                  >
                    <option value="">
                      {servicesLoading
                        ? "Services load ho rahi hain..."
                        : "Aapko kya kaam karwana hai?"}
                    </option>
                    {activeServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center rounded-xl border border-slate-200 px-4 md:w-56">
                  <span className="mr-3 text-xl">📍</span>
                  <select className="w-full bg-transparent py-4 outline-none">
                    <option>Hardoi</option>
                    <option>Other Area</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => findExperts()}
                  className="rounded-xl bg-blue-700 px-7 py-4 font-semibold text-white transition hover:bg-blue-800"
                >
                  Find Expert
                </button>
              </div>
            </div>

            {/* Trust Points */}
            <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3">
              {trustPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <span className="font-bold text-green-600">✓</span>
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="font-semibold text-blue-700">OUR SERVICES</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Aapko kis service ki zarurat hai?
          </h2>
          <p className="mt-3 text-slate-600">
            Verified professionals se apna kaam aasani se karwayein.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {servicesError && (
            <p className="col-span-full text-center text-red-700">{servicesError}</p>
          )}
          {activeServices.map((service) => {
            const card = serviceCards.find((item) => item.name === service.name);

            return (
            <button
              key={service.id}
              type="button"
              onClick={() => findExperts(service.id)}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
            >
              <div className="mb-5 text-4xl">{card?.icon ?? "\u{1F527}"}</div>

              <h3 className="text-lg font-bold group-hover:text-blue-700">
                {service.name}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {service.description || card?.description || "Verified professional service"}
              </p>

              <div className="mt-5 text-sm font-semibold text-blue-700">
                Find Expert →
              </div>
            </button>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="font-semibold text-blue-700">HOW IT WORKS</p>
            <h2 className="mt-2 text-3xl font-bold">
              Kaam karwana ab simple hai
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {[
              ["01", "Service Choose Karein", "Apni required service select karein."],
              ["02", "Problem Batayein", "Apni problem aur location share karein."],
              ["03", "Verified Expert Choose Karein", "Rating aur reliability dekhkar expert choose karein."],
              ["04", "Kaam Complete Karein", "Service complete hone ke baad rating dein."],
            ].map(([number, title, description]) => (
              <div key={number} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white">
                  {number}
                </div>

                <h3 className="mt-5 font-bold">{title}</h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="trust" className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="font-semibold text-blue-400">WHY KAAMSETU</p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Sirf professional nahi,
                <span className="block text-blue-400">
                  reliable professional.
                </span>
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-slate-300">
                Hamara goal sirf professionals ki list dena nahi hai.
                KaamSetu ka focus verification, ratings, reliability aur
                customer experience par hai.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  "Identity Verification",
                  "Skill Information",
                  "Customer Ratings",
                  "Reliability Score",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-slate-700 bg-slate-800 p-4"
                  >
                    <div className="font-semibold">✓ {item}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-800 p-8 ring-1 ring-slate-700">
              <div className="text-sm font-medium text-slate-400">
                Example Professional
              </div>

              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-700 text-2xl">
                  👷
                </div>

                <div>
                  <h3 className="text-xl font-bold">Verified Professional</h3>
                  <p className="text-slate-400">Electrician • Hardoi</p>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-700 p-4">
                  <div className="text-sm text-slate-400">Rating</div>
                  <div className="mt-1 text-xl font-bold">⭐ 4.8/5</div>
                </div>

                <div className="rounded-xl bg-slate-700 p-4">
                  <div className="text-sm text-slate-400">
                    Reliability
                  </div>
                  <div className="mt-1 text-xl font-bold text-green-400">
                    94/100
                  </div>
                </div>
              </div>

              <button className="mt-6 w-full rounded-xl bg-blue-700 py-3 font-semibold transition hover:bg-blue-600">
                View Professionals
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Professional CTA */}
      <section className="bg-blue-700 py-14 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold">
            Kya aap professional hain?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-blue-100">
            KaamSetu par register karke apne area mein naye customers aur
            genuine service opportunities pa sakte hain.
          </p>

          <Link
            href="/professional-register"
            className="mt-7 rounded-xl bg-white px-7 py-3 font-bold text-blue-700 transition hover:bg-blue-50"
          >
            Join as Professional
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-8 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-6 text-sm md:flex-row">
          <div>
            <div className="font-bold text-white">KaamSetu</div>
            <div className="mt-1">Har Kaam Ka Verified Expert.</div>
          </div>

          <div>
            © 2026 KaamSetu. Hardoi Pilot.
          </div>
        </div>
      </footer>
    </main>
  );
}
