import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Database,
  Eye,
  FileText,
  Globe2,
  LockKeyhole,
  Mail,
  Scale,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const lastUpdated = "October 25, 2026";

const sections = [
  { id: "overview", label: "Overview" },
  { id: "information", label: "Information we collect" },
  { id: "use", label: "How we use information" },
  { id: "sharing", label: "When information is shared" },
  { id: "security", label: "Security and retention" },
  { id: "rights", label: "Your privacy rights" },
  { id: "children", label: "Children's privacy" },
  { id: "changes", label: "Changes to this policy" },
  { id: "contact", label: "Contact us" },
];

function SectionHeading({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
        <span>{number}</span>
        <span className="h-px w-8 bg-emerald-200" />
        <span>Privacy policy</span>
      </div>
      <h2 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7faf7] text-zinc-800">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50">
              <img
                src="/logo.png"
                alt="Trashure logo"
                className="h-full w-full object-contain p-1"
              />
            </span>
            <span>
              <span className="block text-lg font-black tracking-tight text-zinc-950">
                Trashure
              </span>
              <span className="block text-xs font-medium text-emerald-700">
                By Team Aureloop
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Trashure</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-emerald-100 bg-white">
        <div className="pointer-events-none absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-44 left-1/4 -z-10 h-80 w-80 rounded-full bg-lime-100/50 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              Your privacy matters
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.045em] text-zinc-950 sm:text-5xl lg:text-6xl">
              Privacy, with
              <span className="block text-emerald-700">purpose.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8">
              This policy explains how Trashure collects, uses, stores, and
              shares information when you use our waste recovery and
              sustainability platform. We aim to handle personal information
              thoughtfully and transparently.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-500">
              <span className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-700" />
                Last updated {lastUpdated}
              </span>
              <span className="inline-flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-emerald-700" />
                Philippines
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-[#f7fcf8] p-5 sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-zinc-950">
              The short version
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              We use information to operate accounts, coordinate recovery
              activity, keep the platform safer, and report relevant
              sustainability activity. We do not ask you to share information
              that is unrelated to using Trashure.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:py-14">
        <aside className="h-fit lg:sticky lg:top-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="px-3 pb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
              On this page
            </p>
            <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  <span>{section.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </a>
              ))}
            </nav>
          </div>
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-sm font-bold text-emerald-950">
              Need help with your data?
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-900/75">
              See the contact section for how to reach the Trashure team about
              a privacy request.
            </p>
            <a
              href="#contact"
              className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-800 hover:text-emerald-950"
            >
              Contact options <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </aside>

        <article className="min-w-0 rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          <section id="overview" className="scroll-mt-8 pb-8">
            <SectionHeading number="01" title="Overview" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              Trashure is a platform designed to support waste recovery and
              sustainability activities among residents, recycling partners,
              schools, and local government units (LGUs). In this policy,
              “Trashure,” “we,” and “our” refer to the Trashure platform and
              Team Aureloop. “You” refers to anyone who uses the platform.
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
              This policy is intended to explain our practices in plain
              language. The information actually collected can depend on the
              features you use and the role associated with your account.
              Please do not submit another person’s personal information unless
              you are authorized to do so.
            </p>
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <Scale className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <p className="text-sm leading-6 text-emerald-950">
                We intend to handle personal information in accordance with
                applicable Philippine privacy laws, including the Data Privacy
                Act of 2012 (Republic Act No. 10173), and its implementing rules
                and regulations.
              </p>
            </div>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="information" className="scroll-mt-8 py-8">
            <SectionHeading number="02" title="Information we collect">
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                We collect information that you provide, information created
                through your use of Trashure, and limited technical information
                needed to operate the service.
              </p>
            </SectionHeading>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 p-4">
                <UserRound className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-3 font-bold text-zinc-900">
                  Account and profile
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Details such as your name, email address, account identifier,
                  role, profile image, and onboarding status.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <Database className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-3 font-bold text-zinc-900">
                  Location and participation
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Barangay, city, and province information, along with recovery
                  or collection activity associated with your account.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <Database className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-3 font-bold text-zinc-900">
                  Recovery records
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Where relevant to a feature, material information, recorded
                  weights, transaction status, collection entries, and related
                  timestamps.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <Eye className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-3 font-bold text-zinc-900">
                  Technical and security data
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Limited request, diagnostic, and authentication information
                  may be processed to protect accounts, troubleshoot issues,
                  and maintain the service.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-500">
              Please note: the exact technical logs, analytics, cookies, and
              device information collected depend on the services and
              configuration enabled in the deployed application.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="use" className="scroll-mt-8 py-8">
            <SectionHeading number="03" title="How we use information" />
            <ul className="space-y-3">
              {[
                "Create and maintain accounts, authenticate users, and support account recovery.",
                "Provide features appropriate to your role, such as resident recovery workflows, partner participation, school collection records, and LGU monitoring.",
                "Record and summarize recovery activity, material weights, and participation within the applicable reporting scope.",
                "Respond to support requests, diagnose errors, prevent misuse, and protect the reliability of Trashure.",
                "Meet applicable legal obligations and address legitimate safety or security concerns.",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-600 sm:text-base">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              We should only use personal information for purposes that are
              compatible with the reason it was collected, unless another use
              is permitted by law or you have been appropriately informed.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="sharing" className="scroll-mt-8 py-8">
            <SectionHeading number="04" title="When information is shared" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              Trashure is designed to connect different participants in
              recovery activity. Depending on your role and the feature being
              used, relevant information may be visible to authorized
              participants or administrators who need it to carry out that
              feature.
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-zinc-50 p-4">
                <h3 className="font-bold text-zinc-900">
                  Authorized platform participants
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Relevant account or transaction details may be shared with
                  the recycler, school, or other participant involved in a
                  particular workflow.
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <h3 className="font-bold text-zinc-900">
                  LGU monitoring
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Authorized LGU users may access monitoring summaries and
                  activity records within their assigned jurisdiction and
                  permissions. Access should be limited to what the monitoring
                  feature requires.
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <h3 className="font-bold text-zinc-900">
                  Service providers and legal requirements
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Information may be processed by providers that help operate
                  the service, such as hosting, authentication, database, or
                  email delivery providers. It may also be disclosed where
                  required by law or necessary to protect rights and safety.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              We do not sell your personal information. We do not disclose it
              to unrelated third parties for their own independent marketing.
              Any sharing must be connected to providing Trashure, protecting
              the service, supporting an authorized workflow, or meeting a
              legal obligation.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="security" className="scroll-mt-8 py-8">
            <SectionHeading number="05" title="Security and retention" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <LockKeyhole className="h-6 w-6 text-emerald-700" />
                <h3 className="mt-3 font-bold text-zinc-900">
                  Protecting information
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  We aim to use appropriate technical and organizational
                  safeguards to help prevent unauthorized access, loss, misuse,
                  or disclosure. No online service can guarantee absolute
                  security.
                </p>
              </div>
              <div>
                <Database className="h-6 w-6 text-emerald-700" />
                <h3 className="mt-3 font-bold text-zinc-900">
                  Keeping information
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Information should be retained only as long as reasonably
                  needed for the purposes described here, legitimate
                  operational needs, dispute resolution, and legal obligations.
                  Actual retention periods may differ by record type.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              If you believe an account has been compromised or notice a
              potential privacy incident, contact the Trashure team through an
              official support channel as soon as possible.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="rights" className="scroll-mt-8 py-8">
            <SectionHeading number="06" title="Your privacy rights" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              Subject to applicable law and its conditions, you may have rights
              to be informed about processing, access your personal
              information, request correction, object to certain processing,
              request blocking or erasure where appropriate, and seek
              applicable remedies. You may also raise a concern with the
              National Privacy Commission of the Philippines.
            </p>
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <h3 className="font-bold text-emerald-950">
                How to make a request
              </h3>
              <p className="mt-1 text-sm leading-6 text-emerald-950/80">
                Contact the Trashure team using an official support channel.
                Tell us what you would like to access or change. We may need to
                verify your identity before acting on a request, and some
                information may need to be retained where the law permits or
                requires it.
              </p>
            </div>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="children" className="scroll-mt-8 py-8">
            <SectionHeading number="07" title="Children's privacy" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              Trashure may support school-related collection activities.
              Student information should be provided only where the relevant
              school or authorized adult has the authority to do so and
              appropriate safeguards and permissions are in place. Do not
              submit unnecessary information about a child. If you believe
              information about a child was submitted improperly, contact the
              Trashure team so it can be reviewed.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="changes" className="scroll-mt-8 py-8">
            <SectionHeading number="08" title="Changes to this policy" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              We may update this policy as Trashure evolves, our practices
              change, or legal requirements develop. We will update the date at
              the top of this page when a revised policy is published. Where
              required, we will provide additional notice or obtain consent for
              material changes.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="contact" className="scroll-mt-8 pt-8">
            <SectionHeading number="09" title="Contact us" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              For privacy questions, access or correction requests, or
              concerns about how your information is handled, contact the
              Trashure support team through the support channel available in
              your account or through Trashure’s official communication
              channels. Please describe your request clearly and include
              enough information for us to understand it. Do not send your
              password or verification codes.
            </p>
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-zinc-200 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-zinc-900">
                  Team Aureloop — Trashure
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  We may ask for reasonable information to verify your
                  identity before responding to a request involving personal
                  information. We will handle requests in accordance with
                  applicable law and explain if a request cannot be completed
                  in full.
                </p>
              </div>
            </div>
          </section>

          <div className="mt-8 rounded-2xl bg-zinc-950 p-5 text-white sm:p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <h2 className="font-bold">Our commitment to privacy</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Trashure is built to support a more sustainable community
                  while treating personal information with care. We aim to
                  limit access to authorized users, use information for clear
                  service purposes, and respond responsibly to privacy
                  concerns.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
            <span>© {new Date().getFullYear()} Trashure · Team Aureloop</span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Return to Trashure <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
