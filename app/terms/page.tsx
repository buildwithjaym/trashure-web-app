import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Handshake,
  LockKeyhole,
  Scale,
  ShieldCheck,
  UserRound,
  Recycle,
  AlertTriangle,
} from "lucide-react";

const lastUpdated = "October 25, 2026";

const sections = [
  { id: "acceptance", label: "Acceptance of these terms" },
  { id: "eligibility", label: "Eligibility and accounts" },
  { id: "roles", label: "Platform roles and use" },
  { id: "conduct", label: "Acceptable use" },
  { id: "records", label: "Transactions and records" },
  { id: "content", label: "Your content and permissions" },
  { id: "availability", label: "Service availability" },
  { id: "termination", label: "Suspension and termination" },
  { id: "liability", label: "Disclaimers and liability" },
  { id: "changes", label: "Changes to these terms" },
  { id: "law", label: "Governing law" },
  { id: "contact", label: "Contact" },
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
        <span>Terms of service</span>
      </div>
      <h2 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function TermsPage() {
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
              <FileText className="h-4 w-4" />
              Clear rules. Shared responsibility.
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.045em] text-zinc-950 sm:text-5xl lg:text-6xl">
              Terms that keep
              <span className="block text-emerald-700">Trashure moving.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8">
              These Terms of Service explain the rules for accessing and using
              Trashure, our waste recovery and sustainability platform. By
              using the service, you agree to these terms.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-500">
              <span className="inline-flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-emerald-700" />
                Last updated {lastUpdated}
              </span>
              <span className="inline-flex items-center gap-2">
                <Scale className="h-4 w-4 text-emerald-700" />
                Philippines
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-[#f7fcf8] p-5 sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <Handshake className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-zinc-950">
              Built around participation
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Trashure helps residents, recyclers, schools, and local
              government partners coordinate recovery activities. Each user is
              responsible for accurate information and appropriate use of the
              features available to their account.
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
        </aside>

        <article className="min-w-0 rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          <section id="acceptance" className="scroll-mt-8 pb-8">
            <SectionHeading number="01" title="Acceptance of these terms" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              These Terms of Service (“Terms”) govern your access to and use of
              Trashure, including its website, account features, and tools for
              waste recovery and sustainability activities. “Trashure,” “we,”
              and “our” refer to the Trashure platform operated by Team
              Aureloop. “You” means the individual or organization using the
              service.
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
              By creating an account, accessing, or using Trashure, you agree
              to these Terms and our <Link href="/privacy" className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-900">Privacy Policy</Link>. If you do not agree, do not use the service. If you use Trashure on behalf of an organization, you confirm that you are authorized to act for that organization.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="eligibility" className="scroll-mt-8 py-8">
            <SectionHeading number="02" title="Eligibility and accounts" />
            <ul className="space-y-3">
              {[
                "Provide accurate, current, and complete information when creating or updating an account.",
                "Keep your login credentials and verification codes confidential. Do not share your password or one-time codes with other people.",
                "You are responsible for activity performed through your account, except where applicable law provides otherwise.",
                "Notify us through an official support channel if you suspect unauthorized access or believe your account has been compromised.",
                "Use only the account role and permissions assigned to you. Do not impersonate another person or organization.",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-600 sm:text-base">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="roles" className="scroll-mt-8 py-8">
            <SectionHeading number="03" title="Platform roles and use" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              Trashure provides features for different participants. Available
              features depend on account type, permissions, and the
              functionality enabled in the platform.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 p-4">
                <UserRound className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-3 font-bold text-zinc-900">Residents</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  May use available tools to identify materials, participate in
                  recovery activities, and view their own relevant records.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <Recycle className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-3 font-bold text-zinc-900">Recycler partners</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Are responsible for keeping submitted business, accepted
                  material, and transaction information accurate and lawful.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <Handshake className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-3 font-bold text-zinc-900">Schools</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Must ensure that collection activities and any information
                  submitted for students or school communities are properly
                  authorized.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <Scale className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-3 font-bold text-zinc-900">LGU users</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Must use monitoring information only for authorized
                  responsibilities and within their assigned permissions.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              Trashure is a coordination and information platform. Unless a
              feature expressly states otherwise, it does not itself guarantee
              the quality, legality, availability, price, or completion of a
              transaction between users.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="conduct" className="scroll-mt-8 py-8">
            <SectionHeading number="04" title="Acceptable use" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              You agree to use Trashure lawfully and in a way that respects
              other users, the platform, and the communities it serves. You
              must not:
            </p>
            <ul className="mt-4 space-y-3">
              {[
                "Use Trashure for fraud, deception, harassment, unlawful activity, or to infringe another person's rights.",
                "Submit false, misleading, manipulated, or unauthorized account, collection, weight, material, or transaction information.",
                "Attempt to access another user's account, restricted records, administrative tools, or systems without authorization.",
                "Interfere with platform security, disrupt service, introduce malicious code, or bypass access controls.",
                "Scrape, copy, or reuse platform data in a way that violates law, privacy rights, or these Terms.",
                "Use the service to send unsolicited messages or upload content you do not have the right to share.",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-600 sm:text-base">
                  <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="records" className="scroll-mt-8 py-8">
            <SectionHeading number="05" title="Transactions and records" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              Information displayed or recorded through Trashure may help
              participants coordinate recovery activities and maintain
              operational records. Users who submit or confirm a record are
              responsible for ensuring that it is accurate to the best of
              their knowledge and that they are authorized to submit it.
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
              Unless a specific feature or separate written agreement says
              otherwise, Trashure does not act as a buyer, seller, transporter,
              payment processor, certifier, or guarantor of materials or
              transactions between users. Users should independently confirm
              material condition, accepted types, quantities, pricing, pickup
              arrangements, and any applicable safety requirements before
              completing a transaction.
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
              If a record appears incorrect, use the available correction or
              support process. We may retain audit or transaction history when
              reasonably needed for security, dispute resolution, operational
              integrity, or legal compliance.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="content" className="scroll-mt-8 py-8">
            <SectionHeading number="06" title="Your content and permissions" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              You retain any rights you hold in content you submit, subject to
              applicable law and the rights of others. By submitting content
              to Trashure, you give us permission to host, store, reproduce,
              display, and process it only as reasonably necessary to operate,
              secure, maintain, and improve the service and provide the
              features you use.
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
              You confirm that you have the rights and permissions needed to
              submit that content and that it does not unlawfully disclose
              another person's personal information, confidential information,
              or protected material. This permission ends when the content is
              removed from the service, except where copies must be retained
              for legitimate operational, security, dispute, backup, or legal
              reasons.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="availability" className="scroll-mt-8 py-8">
            <SectionHeading number="07" title="Service availability and changes" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              We aim to keep Trashure useful and available, but we do not
              guarantee uninterrupted, error-free, or continuously available
              service. Features may be updated, suspended, limited, or
              discontinued to maintain security, address technical issues,
              comply with law, or improve the platform.
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
              You are responsible for maintaining suitable access to the
              internet and compatible devices. We recommend keeping any
              important records you are entitled to retain through your own
              appropriate business or organizational processes.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="termination" className="scroll-mt-8 py-8">
            <SectionHeading number="08" title="Suspension and termination" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              We may restrict, suspend, or terminate access where reasonably
              necessary to protect users, investigate suspected abuse, address
              a security risk, enforce these Terms, comply with legal
              requirements, or respond to conduct that threatens the platform
              or its participants. Where appropriate and legally permitted, we
              will provide notice or an opportunity to resolve the issue.
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
              You may stop using Trashure at any time. Account closure does not
              automatically require deletion of every record; some information
              may need to be retained as described in our <Link href="/privacy" className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-900">Privacy Policy</Link> or as required or permitted by law.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="liability" className="scroll-mt-8 py-8">
            <SectionHeading number="09" title="Disclaimers and liability" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              To the extent permitted by law, Trashure is provided on an
              “as available” basis. We do not warrant that all information
              submitted by users is accurate, that a recovery opportunity will
              be available, or that another participant will perform an
              obligation. Users remain responsible for their own decisions,
              representations, conduct, and agreements.
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
              Nothing in these Terms excludes or limits a right, remedy, or
              liability that cannot lawfully be excluded or limited. To the
              extent permitted by law, we are not responsible for indirect or
              consequential loss arising from use of the platform, third-party
              conduct, service interruptions, or inaccurate user-submitted
              information. This section does not remove responsibilities that
              applicable law places on us.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="changes" className="scroll-mt-8 py-8">
            <SectionHeading number="10" title="Changes to these terms" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              We may update these Terms as Trashure evolves or legal
              requirements change. When we publish a revision, we will update
              the date shown at the top of this page. Where required by law or
              appropriate for a material change, we will provide notice or
              request your agreement. Continued use after updated Terms take
              effect means you accept them to the extent permitted by law.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="law" className="scroll-mt-8 py-8">
            <SectionHeading number="11" title="Governing law and disputes" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              These Terms are governed by the laws of the Republic of the
              Philippines, without removing any consumer or other protections
              that apply by law. If a concern arises, please contact us first
              so we can try to resolve it constructively. Any formal dispute
              will be handled by a court or other body with proper jurisdiction
              under applicable law.
            </p>
          </section>

          <div className="border-t border-zinc-100" />

          <section id="contact" className="scroll-mt-8 pt-8">
            <SectionHeading number="12" title="Contact" />
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              For questions about these Terms, account access, or platform
              use, contact the Trashure support team through the support
              channel available in your account or through Trashure’s official
              communication channels. Do not send your password or
              verification codes in a support request.
            </p>
          </section>

          <div className="mt-8 rounded-2xl bg-zinc-950 p-5 text-white sm:p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <h2 className="font-bold">Fair use. Shared progress.</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  By using Trashure responsibly, you help create a safer,
                  more reliable space for communities and partners to
                  participate in waste recovery.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
            <span>© {new Date().getFullYear()} Trashure · Team Aureloop</span>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Read our Privacy Policy <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
