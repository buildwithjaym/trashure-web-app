"use client";

import { ArrowRight, Check, Building2, Store, Users } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Residents",
    audience: "For individuals and households",
    icon: Users,
    badge: "Community",
    basicPrice: "FREE",
    basicFeatures: [
      "AI waste identification",
      "Segregation guidance",
      "Nearby junkshop discovery",
    ],
    proPrice: "₱99",
    proPeriod: "/ month",
    proFeatures: [
      "Personal impact reports",
      "Rewards and badges",
      "Advanced sorting tips",
    ],
    cta: "Explore Trashure",
    href: "/login",
  },
  {
    name: "Junkshops",
    audience: "For recycling and recovery partners",
    icon: Store,
    badge: "Popular",
    basicPrice: "FREE",
    basicFeatures: [
      "Business listing",
      "Customer referrals",
      "Basic transaction records",
    ],
    proPrice: "₱299",
    proPeriod: "/ month",
    proFeatures: [
      "Enhanced business visibility",
      "Lead management tools",
      "Business analytics",
    ],
    cta: "Join as a junkshop",
    href: "/login",
    featured: true,
  },
  {
    name: "LGUs & Organizations",
    audience: "For communities and institutions",
    icon: Building2,
    badge: "Institutional",
    basicPrice: "LIMITED FREE",
    basicFeatures: [
      "Limited user access",
      "Basic recovery reports",
      "Pilot features",
    ],
    proPrice: "₱10,000",
    proPeriod: "/ month",
    proFeatures: [
      "Recovery dashboards",
      "Community and program reports",
      "Multi-user access and data export",
    ],
    cta: "Discuss an institutional plan",
    href: "/contact",
  },
];

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="mt-5 space-y-3 text-sm leading-6 text-zinc-600">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2.5">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export function Component() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 border-y border-green-100 bg-gradient-to-b from-green-50/80 via-white to-emerald-50/70 px-5 py-16 text-zinc-900 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto mb-12 max-w-3xl text-center sm:mb-14">
          <span className="inline-flex items-center rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-semibold tracking-wide text-green-700 shadow-sm">
            TRASHURE PRICING
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight sm:text-5xl">
            Simple plans. <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Smarter recovery.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
            Start for free and upgrade when you need more. Every role gets a plan designed around its needs.
          </p>
        </header>

        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <article
                key={plan.name}
                className={`relative flex h-full flex-col rounded-3xl border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-900/10 sm:p-7 ${
                  plan.featured
                    ? "border-2 border-emerald-500 shadow-lg shadow-emerald-900/10"
                    : "border-green-100"
                }`}
              >
                {plan.featured && (
                  <span className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-700 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Popular
                  </span>
                )}

                <div className="flex items-start gap-3 pr-16">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 text-green-700 ring-1 ring-green-100">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">{plan.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">{plan.audience}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-green-100 bg-green-50/50 p-4">
                  <p className="text-sm font-semibold">Basic</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-700">{plan.basicPrice}</p>
                  <FeatureList features={plan.basicFeatures} />
                </div>

                <div className="mt-3 rounded-2xl border border-emerald-100 bg-white p-4">
                  <p className="text-sm font-semibold">Pro</p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-1.5">
                    <span className="text-3xl font-bold tracking-tight text-emerald-700">{plan.proPrice}</span>
                    <span className="text-sm text-zinc-500">{plan.proPeriod}</span>
                  </p>
                  <FeatureList features={plan.proFeatures} />
                </div>

                <Link
                  href={plan.href}
                  className={`mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-center text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
                    plan.featured
                      ? "bg-gradient-to-r from-green-500 to-emerald-700 text-white shadow-md shadow-green-700/15 hover:shadow-lg"
                      : "border border-green-200 bg-white text-green-800 hover:border-green-400 hover:bg-green-50"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-green-200 bg-white/90 px-5 py-4 text-center shadow-sm sm:px-8">
          <p className="text-sm leading-6 text-zinc-600">
            <span className="font-semibold text-green-800">Primary revenue:</span> LGU and organization subscriptions
            <span className="mx-2 hidden text-green-300 sm:inline">|</span>
            <span className="mt-1 inline-block sm:mt-0"><span className="font-semibold text-green-800">Secondary revenue:</span> Junkshop Pro plans</span>
          </p>
          <p className="mt-2 text-xs text-zinc-500">Proposed launch pricing, subject to customer validation.</p>
        </div>
      </div>
    </section>
  );
}

export default Component;
