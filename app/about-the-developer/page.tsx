import type { SVGProps } from "react";

import Image from "next/image";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowUpRight,
  BrainCircuit,
  Code2,
  Database,
  Globe2,
  Leaf,
  Recycle,
  Rocket,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UserRound,
  Workflow,
} from "lucide-react";



const developerLinks = {
  portfolio: "https://www.jaymmaruji.online",
  github: "https://github.com/buildwithjaym",
  facebook: "https://www.facebook.com/jaymar.maruji",
};

const expertise = [
  {
    title: "Product Engineering",
    description:
      "Turning an initial concept into a complete product with clear user flows, responsive interfaces, backend services, and deployment.",
    icon: Rocket,
  },
  {
    title: "AI Integration",
    description:
      "Connecting artificial intelligence with practical workflows that help users understand materials and make better recovery decisions.",
    icon: BrainCircuit,
  },
  {
    title: "Full-Stack Development",
    description:
      "Building and maintaining the frontend, database, authentication, storage, security policies, and application logic.",
    icon: Code2,
  },
];

const responsibilities = [
  "Product research and concept development",
  "UI and responsive experience design",
  "Next.js frontend engineering",
  "Database architecture and security",
  "Authentication and user onboarding",
  "Image upload and AI analysis workflow",
  "Application testing and deployment",
  "Continuous product improvement",
];

const technologyStack = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Supabase",
  "PostgreSQL",
  "AI Vision",
  "Vercel",
];

const architecture = [
  {
    label: "Experience",
    title: "Next.js Application",
    description:
      "Responsive interfaces for residents, administrators, recyclers, schools, and community partners.",
    icon: Globe2,
  },
  {
    label: "Intelligence",
    title: "AI Material Analysis",
    description:
      "Visual analysis that identifies an item, its material type, and possible circular recovery actions.",
    icon: ScanLine,
  },
  {
    label: "Data",
    title: "Supabase Platform",
    description:
      "Authentication, PostgreSQL data, image storage, user profiles, scans, and community-level insights.",
    icon: Database,
  },
  {
    label: "Protection",
    title: "Application Security",
    description:
      "Controlled data access through authentication, validation, storage policies, and row-level security.",
    icon: ShieldCheck,
  },
];

function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.18c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.39.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.28-5.27-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.19-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.03 10.13 11.93v-8.53H7.08v-3.4h3.05V9.48c0-3 1.78-4.67 4.5-4.67 1.3 0 2.67.24 2.67.24v2.94h-1.5c-1.49 0-1.95.93-1.95 1.88v2.2h3.32l-.53 3.4h-2.79V24C19.6 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

export default function AboutTheDeveloperPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07100b] text-white">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-12rem] top-24 h-[30rem] w-[30rem] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute right-[-10rem] top-[35rem] h-[28rem] w-[28rem] rounded-full bg-lime-400/5 blur-[130px]" />
        <div className="absolute bottom-0 left-1/2 h-[24rem] w-[45rem] -translate-x-1/2 rounded-full bg-green-500/5 blur-[150px]" />
      </div>

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07100b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Back to Trashure</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white">
              <Image
                src="/logo.png"
                alt="Trashure"
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-black tracking-[0.16em] text-emerald-400">
                TRASHURE
              </p>
              <p className="text-xs text-zinc-500">Developer profile</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 pb-20 pt-32 sm:px-6 sm:pb-28 sm:pt-40 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              <UserRound className="h-4 w-4" />
              Solo developer behind Trashure
            </div>

            <h1 className="mt-7 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Building technology
              <span className="block bg-gradient-to-r from-emerald-300 via-lime-200 to-green-400 bg-clip-text text-transparent">
                with a practical purpose.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl">
              I am <strong className="font-semibold text-white">Jaymar Maruji</strong>,
              the solo developer and product builder behind Trashure. I designed
              and developed the platform to explore how artificial intelligence
              can help people recognize value before an item becomes waste.
            </p>

            <p className="mt-5 max-w-2xl leading-7 text-zinc-400">
              Trashure is more than a technical project. It is an attempt to make
              responsible waste decisions easier, more understandable, and more
              accessible to residents, schools, recyclers, organizations, and
              local communities.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={developerLinks.portfolio}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-400 px-7 py-3.5 font-bold text-emerald-950 transition hover:-translate-y-1 hover:bg-emerald-300 sm:w-auto"
              >
                View my portfolio
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <a
                href={developerLinks.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-7 py-3.5 font-semibold text-white transition hover:-translate-y-1 hover:border-white/30 hover:bg-white/10 sm:w-auto"
              >
                <GitHubIcon className="h-5 w-5" />
                GitHub
              </a>

              <a
                href={developerLinks.facebook}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-7 py-3.5 font-semibold text-white transition hover:-translate-y-1 hover:border-blue-400/40 hover:bg-blue-500/10 sm:w-auto"
              >
                <FacebookIcon className="h-5 w-5" />
                Facebook
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-zinc-400">
              <span className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-emerald-400" />
                Full-stack development
              </span>

              <span className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-emerald-400" />
                AI integration
              </span>

              <span className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-emerald-400" />
                Sustainability technology
              </span>
            </div>
          </div>

          {/* Developer photo */}
          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <div className="relative w-full max-w-[430px]">
              <div className="absolute -inset-5 rounded-[3rem] bg-gradient-to-br from-emerald-400/20 via-transparent to-lime-300/10 blur-2xl" />

              <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.05] p-2 shadow-2xl shadow-black/40">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.8rem]">
                  <Image
                    src="/me.jpg"
                    alt="Jaymar Maruji, developer of Trashure"
                    fill
                    priority
                    sizes="(max-width: 1024px) 90vw, 430px"
                    className="object-cover object-center"
                  />

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-6 pb-6 pt-28">
                    <p className="text-2xl font-bold text-white">
                      Jaymar Maruji
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      Software Engineer · Product Builder
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-3 rounded-2xl border border-emerald-400/20 bg-[#0d1912]/95 px-5 py-4 shadow-xl backdrop-blur-xl sm:-left-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
                  Built independently
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  One developer. One product vision.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick story */}
      <section className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] lg:grid-cols-[0.75fr_1.25fr]">
            <div className="relative flex min-h-[310px] items-center justify-center overflow-hidden border-b border-white/10 p-10 lg:border-b-0 lg:border-r">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.14),transparent_60%)]" />

              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 shadow-2xl shadow-emerald-950/30">
                  <Recycle className="h-11 w-11" />
                </div>

                <div className="absolute -right-8 -top-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-lime-300/20 bg-lime-300/10 text-lime-200">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div className="absolute -bottom-7 -left-9 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-zinc-300">
                  <Code2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="p-7 sm:p-10 lg:p-14">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-400">
                The quick story
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Trashure started with a simple question.
              </h2>

              <blockquote className="mt-6 border-l-2 border-emerald-400 pl-5 text-xl font-medium leading-8 text-zinc-200 sm:text-2xl">
                “What if people could understand the remaining value of an item
                before deciding to throw it away?”
              </blockquote>

              <div className="mt-7 space-y-5 leading-7 text-zinc-400">
                <p>
                  Many useful materials are discarded not because they have no
                  value, but because people do not have enough information about
                  what those materials are, how they can be reused, or where they
                  can go next.
                </p>

                <p>
                  That problem became the foundation of Trashure. I began
                  developing a platform that could combine image analysis,
                  material information, circular recommendations, and community
                  data in one accessible application.
                </p>

                <p>
                  As a solo developer, I handled the product concept, interface,
                  application architecture, database, authentication, security,
                  AI workflow, testing, and deployment. Each part of the platform
                  was developed around one principle: technology should make
                  sustainable action easier to understand and easier to perform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Trashure was built */}
      <section className="relative border-y border-white/10 bg-white/[0.025] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-400">
              Why I built Trashure
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Waste is often an information problem before it becomes an
              environmental problem.
            </h2>

            <p className="mt-6 text-lg leading-8 text-zinc-400">
              Trashure was built to close the gap between seeing an unwanted item
              and knowing the most useful action to take next.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <article className="rounded-[1.75rem] border border-white/10 bg-[#0b1710] p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <ScanLine className="h-6 w-6" />
              </div>

              <h3 className="mt-6 text-xl font-bold">
                Make material information accessible
              </h3>

              <p className="mt-3 leading-7 text-zinc-400">
                Help ordinary users identify items and understand what materials
                they are dealing with without requiring technical expertise.
              </p>
            </article>

            <article className="rounded-[1.75rem] border border-white/10 bg-[#0b1710] p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <Recycle className="h-6 w-6" />
              </div>

              <h3 className="mt-6 text-xl font-bold">
                Provide practical next actions
              </h3>

              <p className="mt-3 leading-7 text-zinc-400">
                Move beyond simple identification by recommending whether an item
                may be reused, repaired, donated, sold, recovered, or recycled.
              </p>
            </article>

            <article className="rounded-[1.75rem] border border-white/10 bg-[#0b1710] p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <Database className="h-6 w-6" />
              </div>

              <h3 className="mt-6 text-xl font-bold">
                Turn actions into useful insight
              </h3>

              <p className="mt-3 leading-7 text-zinc-400">
                Convert individual activity into structured data that can support
                schools, organizations, recyclers, and local sustainability
                programs.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Solo development */}
      <section className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:sticky lg:top-32">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              <Workflow className="h-4 w-4" />
              Independent product development
            </div>

            <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-5xl">
              One developer,
              <span className="block text-emerald-400">
                full product ownership.
              </span>
            </h2>

            <p className="mt-6 max-w-xl leading-7 text-zinc-400">
              Building independently required me to work across product strategy,
              design, engineering, security, testing, and deployment. It also
              allowed the platform to maintain a consistent vision from the
              original idea to the working application.
            </p>

            <a
              href={developerLinks.portfolio}
              target="_blank"
              rel="noreferrer"
              className="group mt-8 inline-flex items-center gap-2 font-semibold text-emerald-300 transition hover:text-emerald-200"
            >
              See my other work
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {responsibilities.map((responsibility, index) => (
              <div
                key={responsibility}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.04]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-xs font-black text-emerald-300">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <p className="pt-1 text-sm font-medium leading-6 text-zinc-300">
                  {responsibility}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-400">
              Engineering focus
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              From product idea to deployed platform.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {expertise.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="group rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-7 transition duration-300 hover:-translate-y-2 hover:border-emerald-400/20 hover:bg-emerald-400/[0.04]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/10 text-emerald-300">
                    <Icon className="h-7 w-7 transition group-hover:scale-110" />
                  </div>

                  <h3 className="mt-6 text-xl font-bold">{item.title}</h3>

                  <p className="mt-3 leading-7 text-zinc-400">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="relative border-y border-white/10 bg-white/[0.025] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-400">
                Technology stack
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Modern tools selected for speed, scalability, and maintainability.
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {technologyStack.map((technology) => (
                <span
                  key={technology}
                  className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-5 py-3 text-sm font-semibold text-emerald-200"
                >
                  {technology}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-400">
              Behind Trashure
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              A connected system for recognition, recommendations, and impact.
            </h2>
          </div>

          <div className="relative mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {architecture.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="relative rounded-[1.75rem] border border-white/10 bg-[#0b1710] p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                      <Icon className="h-6 w-6" />
                    </div>

                    <span className="text-xs font-black tracking-[0.18em] text-zinc-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
                    {item.label}
                  </p>

                  <h3 className="mt-2 text-xl font-bold">{item.title}</h3>

                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/10 via-white/[0.03] to-transparent p-7 text-center sm:p-12 lg:p-16">
          <Sparkles className="mx-auto h-9 w-9 text-emerald-300" />

          <p className="mt-7 text-2xl font-bold leading-relaxed text-white sm:text-3xl lg:text-4xl">
            “I built Trashure because useful technology should not only be
            intelligent. It should help people make clearer and more responsible
            decisions.”
          </p>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Jaymar Maruji · Solo Developer
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-4 pb-20 pt-10 sm:px-6 sm:pb-28 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-400 via-green-400 to-lime-300 px-6 py-12 text-center text-emerald-950 sm:px-10 sm:py-16">
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
            Explore more of my work.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-emerald-950/75">
            Visit my portfolio to see more projects, technical work, experiments,
            and the continued development of Trashure.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={developerLinks.portfolio}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-950 px-7 py-3.5 font-bold text-white transition hover:-translate-y-1 hover:bg-black"
            >
              jaymmaruji.online
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-950/20 bg-white/25 px-7 py-3.5 font-bold text-emerald-950 transition hover:-translate-y-1 hover:bg-white/40"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Trashure
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center text-sm text-zinc-500 sm:flex-row sm:text-left">
          <p>© 2026 Trashure. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <a
              href={developerLinks.github}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub profile"
              className="text-zinc-400 transition hover:text-white"
            >
              <GitHubIcon className="h-5 w-5" />
            </a>

            <a
              href={developerLinks.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook profile"
              className="text-zinc-400 transition hover:text-blue-400"
            >
              <FacebookIcon className="h-5 w-5" />
            </a>

            <a
              href={developerLinks.portfolio}
              target="_blank"
              rel="noreferrer"
              aria-label="Developer portfolio"
              className="text-zinc-400 transition hover:text-emerald-400"
            >
              <Globe2 className="h-5 w-5" />
            </a>
          </div>

          <p>
            Designed and developed by{" "}
            <span className="font-semibold text-emerald-400">
              Jaymar Maruji
            </span>
          </p>
        </div>
      </footer>
    </main>
  );
}