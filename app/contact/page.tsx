import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Globe2,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
} from "lucide-react";

const CONTACT_EMAIL = "jaymmaruji@gmail.com";
const CONTACT_NAME = "Jaymar Maruji";
const PORTFOLIO_URL = "https://www.jaymmaruji.online";

const contactTopics = [
  {
    title: "Project questions",
    description:
      "Questions about Trashure, its features, or how the platform works.",
  },
  {
    title: "Feedback and ideas",
    description:
      "Suggestions, usability feedback, and ideas that could make Trashure better.",
  },
  {
    title: "Collaboration",
    description:
      "Research, sustainability initiatives, and opportunities to work together.",
  },
];

export default function ContactPage() {
  const emailSubject = encodeURIComponent("Contacting Trashure");
  const emailBody = encodeURIComponent(
    "Hi Jaymar,\n\nI am reaching out regarding Trashure.\n\n"
  );
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07100b] text-white">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-24 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute -right-40 top-[30rem] h-[30rem] w-[30rem] rounded-full bg-lime-400/[0.06] blur-[140px]" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-[#07100b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
          >
            <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Back to Trashure</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <Link href="/" aria-label="Trashure home" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white">
              <Image
                src="/logo.png"
                alt="Trashure logo"
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </span>
            <span className="text-sm font-black tracking-[0.16em] text-emerald-400">
              TRASHURE
            </span>
          </Link>
        </div>
      </header>

      <section className="relative px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              <MessageCircle className="h-4 w-4" />
              Contact Trashure
            </div>

            <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Have a question?
              <span className="mt-2 block bg-gradient-to-r from-emerald-300 via-lime-200 to-green-400 bg-clip-text text-transparent">
                Let&apos;s talk.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
              We welcome questions, feedback, and collaboration ideas that help
              make Trashure more useful. Reach out directly by email and your
              message will be addressed to the contact below.
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <Mail className="h-5 w-5" />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Email address
                </p>
                <a
                  href={mailto}
                  className="mt-2 inline-flex max-w-full break-all text-base font-semibold text-white transition hover:text-emerald-300 sm:text-lg"
                >
                  {CONTACT_EMAIL}
                  <ArrowUpRight className="ml-1 mt-0.5 h-4 w-4 shrink-0" />
                </a>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <Globe2 className="h-5 w-5" />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Contact person
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {CONTACT_NAME}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Trashure project contact
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4 text-sm leading-6 text-zinc-300">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <p>
                For your privacy, include only the information needed to explain
                your request. Do not email passwords, verification codes, or
                other sensitive account credentials.
              </p>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-[#0b1710]/90 p-5 shadow-2xl shadow-black/20 sm:p-7 lg:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  Get in touch
                </p>
                <h2 className="text-xl font-bold sm:text-2xl">
                  How can we help?
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Choose a topic to help frame your message, then open your email
              app to contact Jaymar directly.
            </p>

            <div className="mt-6 space-y-3">
              {contactTopics.map((topic, index) => (
                <div
                  key={topic.title}
                  className="flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-xs font-bold text-emerald-300">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{topic.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      {topic.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href={mailto}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-300 px-6 py-3.5 text-center font-bold text-emerald-950 transition hover:-translate-y-0.5 hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-[#0b1710]"
            >
              Email Jaymar
              <ArrowUpRight className="h-4 w-4" />
            </a>

            <p className="mt-3 text-center text-xs leading-5 text-zinc-500">
              This button opens your default email application. It does not
              submit a message through this website.
            </p>
          </aside>
        </div>
      </section>

      <section className="relative border-t border-white/10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <p className="font-semibold text-white">More about the project</p>
            <p className="mt-1 text-sm text-zinc-400">
              Learn about the people and ideas behind Trashure.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/about-developer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
            >
              About the developer
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
            >
              Developer portfolio
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-white/10 px-4 py-6 text-center text-xs text-zinc-500 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Trashure. Built with a purpose.
      </footer>
    </main>
  );
}
