"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  Camera,
  CheckCircle2,
  Coins,
  Gift,
  GraduationCap,
  Handshake,
  ImageIcon,
  Leaf,
  Lightbulb,
  Menu,
  Recycle,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  Users,
  X,
} from "lucide-react";
import { DownloadApkPrompt } from "@/components/download-apk-prompt";
export default function Home() {

  const [mobileOpen, setMobileOpen] = useState(false);

  const problems = [
    {
      title: "Lost Recognition",
      description:
        "People throw away materials because they cannot identify their hidden potential.",
    },
    {
      title: "Lost Opportunities",
      description:
        "Reusable resources disappear before reaching people and organizations that need them.",
    },
    {
      title: "Lost Data",
      description:
        "Communities lack accurate information to create smarter waste solutions.",
    },
  ];


  const solutions = [
    {
      title: "AI Recognition",
      description:
        "Identify materials instantly and understand their recovery potential.",
      icon: Brain,
    },
    {
      title: "Circular Recommendations",
      description:
        "Discover whether materials should be reused, sold, donated, or recycled.",
      icon: Recycle,
    },
    {
      title: "Impact Measurement",
      description:
        "Transform community actions into meaningful sustainability insights.",
      icon: BarChart3,
    },
  ];


const processSteps = [
  {
    icon: Camera,
    title: "Capture your item",
    description: "Take a clear photo or upload an image of your material.",
  },
  {
    icon: Brain,
    title: "Confirm the material",
    description: "Review the AI suggestion and correct it when needed.",
  },
  {
    icon: Coins,
    title: "Choose your next step",
    description: "Explore available recycling, selling, donation, or reuse options.",
  },
  {
    icon: Handshake,
    title: "Complete the recovery",
    description: "Connect with the right people and return the material to circulation.",
  },
];

function MaterialIllustration({ index }: { index: number }) {
  return (
    <svg
      viewBox="0 0 300 320"
      role="img"
      aria-label={`Illustration of ${samples[index].name}`}
      className="h-full w-full drop-shadow-xl"
    >
      <defs>
        <linearGradient id="trashure-material-gradient">
          <stop stopColor="#82bfa0" />
          <stop offset="0.35" stopColor="#f0fff5" />
          <stop offset="0.7" stopColor="#b8ddc8" />
          <stop offset="1" stopColor="#659d7c" />
        </linearGradient>
      </defs>

      <ellipse
        cx="150"
        cy="287"
        rx="68"
        ry="12"
        fill="#14532d"
        opacity="0.12"
      />

      {index === 0 && (
        <g transform="rotate(12 150 160)">
          <rect x="129" y="25" width="42" height="28" rx="6" fill="#22c55e" />
          <path
            d="M133 53V76C133 91 99 104 99 127V256Q99 280 124 281H176Q201 280 201 256V127C201 104 167 91 167 76V53Z"
            fill="url(#trashure-material-gradient)"
            stroke="#69a985"
            strokeWidth="2"
          />
          <path
            d="M105 139H195M105 235H195M110 251H190M117 266H183"
            stroke="#69a985"
            strokeWidth="3"
            opacity="0.5"
          />
          <path
            d="M116 126V248"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.8"
          />
          <rect x="100" y="155" width="100" height="65" rx="3" fill="#15803d" />
          <text x="150" y="180" textAnchor="middle" fill="#bbf7d0" fontSize="10" letterSpacing="3">
            ANOTHER
          </text>
          <text x="150" y="204" textAnchor="middle" fill="white" fontSize="23" fontWeight="700">
            LIFE.
          </text>
        </g>
      )}

      {index === 1 && (
        <g transform="rotate(-10 150 160)">
          <rect
            x="94"
            y="73"
            width="112"
            height="207"
            rx="21"
            fill="url(#trashure-material-gradient)"
            stroke="#789786"
            strokeWidth="2"
          />
          <ellipse cx="150" cy="73" rx="54" ry="12" fill="#e0eee5" stroke="#789786" strokeWidth="3" />
          <ellipse cx="150" cy="74" rx="16" ry="5" fill="#587665" />
          <path d="M112 101V247" stroke="white" strokeWidth="5" opacity="0.7" />
          <rect x="95" y="137" width="110" height="83" fill="#059669" />
          <text x="150" y="168" textAnchor="middle" fill="#a7f3d0" fontSize="11" letterSpacing="2">
            MADE TO
          </text>
          <text x="150" y="195" textAnchor="middle" fill="white" fontSize="22" fontWeight="700">
            RETURN.
          </text>
        </g>
      )}

      {index === 2 && (
        <g>
          <path
            d="M65 119L150 78L236 119V249L150 289L65 249Z"
            fill="#c6a16a"
            stroke="#80603a"
            strokeWidth="2"
          />
          <path d="M150 159L236 119V249L150 289Z" fill="#b18b55" />
          <path d="M65 119L150 159L236 119M150 159V289" fill="none" stroke="#80603a" strokeWidth="2" />
          <path d="M109 98L194 139V172L173 183V150L88 110Z" fill="#ead6b2" />
          <text x="106" y="218" textAnchor="middle" fill="#166534" fontSize="38">
            ↺
          </text>
        </g>
      )}
    </svg>
  );
}

function ScannerPreview() {
  const [selected, setSelected] = useState(0);
  const [phase, setPhase] = useState<"idle" | "scanning" | "complete">("idle");
  const [progress, setProgress] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [error, setError] = useState("");

  const input = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const requestId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current += 1;
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (cameraOpen && video.current && stream.current) {
      video.current.srcObject = stream.current;
    }
  }, [cameraOpen]);

  useEffect(() => {
    if (!image) return;
    return () => URL.revokeObjectURL(image);
  }, [image]);

  useEffect(() => {
    if (phase !== "scanning") return;
    const started = performance.now();
    const timer = window.setInterval(() => {
      const next = Math.min(100, Math.floor((performance.now() - started) / 26));
      setProgress(next);
      if (next === 100) {
        window.clearInterval(timer);
        setPhase("complete");
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [phase]);

  function closeCamera() {
    requestId.current += 1;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setCameraOpen(false);
    setCameraLoading(false);
  }

  function reset(index: number) {
    closeCamera();
    setSelected(index);
    setImage(null);
    setPhase("idle");
    setProgress(0);
    setError("");
  }

  function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Choose an image smaller than 8 MB.");
      return;
    }

    closeCamera();
    setImage(URL.createObjectURL(file));
    setPhase("idle");
    setProgress(0);
    setError("");
  }

  async function openCamera() {
    const request = ++requestId.current;
    setCameraLoading(true);
    setError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Unavailable");
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      if (!mounted.current || request !== requestId.current) {
        next.getTracks().forEach((track) => track.stop());
        return;
      }

      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = next;
      setImage(null);
      setPhase("idle");
      setProgress(0);
      setCameraOpen(true);
    } catch {
      if (mounted.current && request === requestId.current) {
        setError("Camera unavailable. Allow camera access on HTTPS or upload a photo instead.");
      }
    } finally {
      if (mounted.current && request === requestId.current) {
        setCameraLoading(false);
      }
    }
  }

  function capturePhoto() {
    const element = video.current;
    if (!element?.videoWidth) {
      setError("The camera is still loading. Try again in a moment.");
      return;
    }

    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1600 / Math.max(element.videoWidth, element.videoHeight));
    canvas.width = Math.round(element.videoWidth * scale);
    canvas.height = Math.round(element.videoHeight * scale);

    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(element, 0, 0, canvas.width, canvas.height);

    const request = requestId.current;
    canvas.toBlob((blob) => {
      if (!blob || !mounted.current || request !== requestId.current) return;
      setImage(URL.createObjectURL(blob));
      closeCamera();
      setPhase("idle");
      setProgress(0);
      setError("");
    }, "image/jpeg", 0.85);
  }

  const busy = phase === "scanning" || cameraLoading;

  return (
    <div id="scanner" className="scroll-mt-28 overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-[0_24px_80px_-24px_rgba(22,101,52,0.25)]">
      <div className="flex items-center justify-between gap-3 border-b border-green-50 px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <ScanLine className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">Trashure AI Scanner</p>
            <p className="mt-0.5 text-[10px] text-zinc-500">See the potential in your item</p>
          </div>
        </div>
        <span className="rounded-full bg-green-50 px-2.5 py-1 text-[8px] font-bold tracking-wider text-green-700">
          DEMO
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 p-3">
        {samples.map((sample, index) => (
          <button
            key={sample.name}
            type="button"
            aria-pressed={!image && !cameraOpen && selected === index}
            onClick={() => reset(index)}
            className={`min-h-11 rounded-xl px-2 py-2 text-[10px] font-semibold transition sm:text-xs ${
              !image && !cameraOpen && selected === index
                ? "bg-green-50 text-green-700"
                : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            {sample.name}
          </button>
        ))}
      </div>

      <div className="relative mx-4 h-[300px] overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100/70">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(22,163,74,.05) 1px, transparent 1px),linear-gradient(90deg,rgba(22,163,74,.05) 1px,transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <span className="absolute left-4 top-4 z-10 rounded-md bg-white/80 px-2 py-1 font-mono text-[8px] tracking-widest text-green-700">
          {cameraOpen ? "LIVE CAMERA" : image ? "YOUR PHOTO · PREVIEW" : "SAMPLE OBJECT"}
        </span>

        {cameraOpen ? (
          <video ref={video} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-contain" />
        ) : image ? (
          <img
            src={image}
            alt="Your material preview"
            className="absolute inset-0 h-full w-full object-contain"
            onError={() => {
              setImage(null);
              setPhase("idle");
              setError("This image could not be opened. Try another image.");
            }}
          />
        ) : (
          <div className="absolute inset-x-7 bottom-0 top-3">
            <MaterialIllustration index={selected} />
          </div>
        )}

        <div aria-hidden="true" className="pointer-events-none absolute inset-x-12 bottom-12 top-12 sm:inset-x-16">
          <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-green-500" />
          <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-green-500" />
          <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-green-500" />
          <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-green-500" />
          {phase === "scanning" && <div className="trashure-scan-beam" />}
        </div>

        <span className="absolute bottom-4 left-4 rounded-md bg-white/80 px-2 py-1 font-mono text-[8px] tracking-widest text-green-700">
          {phase === "scanning" ? "SCANNING SURFACE" : phase === "complete" ? "PREVIEW COMPLETE" : "READY TO EXPLORE"}
        </span>
      </div>

      <div className="p-5">
        <div role="status" aria-live="polite" className="flex min-h-12 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
            {phase === "complete" ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-semibold">
              {phase === "scanning"
                ? "Exploring the material…"
                : phase === "complete"
                  ? image ? "Your photo is ready." : samples[selected].material
                  : cameraOpen ? "Frame your item." : "Try your first sample scan."}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
              {phase === "complete"
                ? image ? "Continue to the app for AI identification." : "Illustrative result. Confirm the material in the app."
                : "Select a sample, upload a photo, or use your camera."}
            </p>
          </div>
        </div>

        {phase === "scanning" && (
          <div
            role="progressbar"
            aria-label="Scan animation progress"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-4 h-1 overflow-hidden rounded-full bg-green-50"
          >
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-600" style={{ width: `${progress}%` }} />
          </div>
        )}

        {phase === "complete" && !image && (
          <p className="mt-4 rounded-xl border border-green-100 bg-green-50 p-3 text-xs leading-relaxed text-green-800">
            {samples[selected].tip}
          </p>
        )}

        {cameraOpen ? (
          <button type="button" onClick={capturePhoto} className={`${primaryButton} mt-5 w-full`}>
            <Camera className="h-4 w-4 shrink-0" />
            Capture photo
          </button>
        ) : phase === "complete" && image ? (
          <Link href="/profiles/resident/scan" className={`${primaryButton} mt-5 w-full`}>
            Continue to AI scanner
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setProgress(0);
              setPhase("scanning");
              setError("");
            }}
            className={`${primaryButton} mt-5 w-full disabled:cursor-wait disabled:opacity-70`}
          >
            <ScanLine className="h-4 w-4 shrink-0" />
            {phase === "scanning"
              ? `Scanning ${progress}%`
              : phase === "complete" ? "Scan again"
              : image ? "Preview scan effect" : "Try a sample scan"}
          </button>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-2 py-2 text-xs font-medium text-zinc-600 transition hover:border-green-300 hover:bg-green-50 disabled:opacity-50"
          >
            <Upload className="h-4 w-4 shrink-0" />
            Upload photo
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={cameraOpen ? closeCamera : openCamera}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-2 py-2 text-xs font-medium text-zinc-600 transition hover:border-green-300 hover:bg-green-50 disabled:opacity-50"
          >
            <Camera className="h-4 w-4 shrink-0" />
            {cameraLoading ? "Opening…" : cameraOpen ? "Close camera" : "Use camera"}
          </button>
        </div>

        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} hidden />

        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
          <ShieldCheck className="h-3 w-3 shrink-0" />
          Demo photos stay in your browser.
        </p>

        {image && phase === "complete" && (
          <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-500">
            Select your photo again in the app. This demo previews the scan effect without identifying or uploading your image.
          </p>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="trashure-page min-h-screen overflow-x-clip bg-white text-zinc-900 selection:bg-green-200">
      <header className="sticky top-0 z-50 border-b border-green-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" aria-label="Trashure home" className="flex shrink-0 items-center gap-3">
            <img src="/logo.png" alt="" className="h-11 w-11 rounded-xl bg-green-50 object-contain" />
            <div>
              <span className="bg-gradient-to-r from-green-500 to-emerald-700 bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl">
                TRASHURE
              </span>
              <p className="text-[10px] text-zinc-500">Turn Trash into Treasure</p>
            </div>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-6 text-xs font-medium text-zinc-600 lg:flex">
            {navigation.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-green-600">{item.label}</a>
            ))}
            <Link href="/about-the-developer" className="hover:text-green-600">About developer</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-700 px-5 text-sm font-semibold text-white sm:inline-flex">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-green-700 lg:hidden"
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav id="mobile-navigation" aria-label="Mobile navigation" className="grid gap-1 border-t border-green-100 bg-white px-5 py-4 lg:hidden">
            {navigation.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm hover:bg-green-50">
                {item.label}
              </a>
            ))}
            <Link href="/about-the-developer" className="rounded-xl px-4 py-3 text-sm hover:bg-green-50">About developer</Link>
            <Link href="/login" className={`${primaryButton} mt-3`}>Start your journey <ArrowRight className="h-4 w-4" /></Link>
          </nav>
        )}
      </header>

      <section id="home" className="relative isolate bg-gradient-to-br from-white via-green-50/80 to-white">
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-12 -z-10 h-80 w-80 rounded-full bg-green-200/30 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.12fr_1fr] lg:gap-16 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-4 py-2 text-[10px] font-semibold text-green-700 sm:text-xs">
              <Sparkles className="h-4 w-4 shrink-0" />
              AI-powered circular economy platform
            </span>

            <h1 className="mt-7 text-[clamp(3rem,5.6vw,5rem)] font-bold leading-[1.08] tracking-[-0.045em]">
              What if waste<br />
              was a missed<br />
              <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-700 bg-clip-text text-transparent">
                opportunity?
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-zinc-600">
              A bottle. A box. Something you almost threw away.
              Trashure helps you see what it is—and what it can become.
            </p>
            <p className="mt-3 max-w-lg text-sm leading-7 text-zinc-500">
              Identify materials, confirm the result, and find a practical way to recycle, sell, donate, or reuse them.
            </p>

            <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
              <Link href="/login" className={`${primaryButton} w-full`}>
                <ScanLine className="h-4 w-4 shrink-0" />
                Start scanning
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
              <a href="#scanner" className={`${secondaryButton} w-full`}>
                <Sparkles className="h-4 w-4 shrink-0" />
                Try the scanner demo
              </a>
            </div>

            <div className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
              <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
              <p>AI assists. You confirm. Your community takes it further.</p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[460px]">
            <p className="mb-4 flex items-center justify-end gap-2 text-xs font-medium text-green-700">
              <Leaf className="h-4 w-4" />
              A second life starts here.
            </p>
            <ScannerPreview />
          </div>
        </div>
      </section>

      <div className="border-y border-green-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-6">
          <span className="text-[9px] font-bold tracking-widest text-zinc-400">FIND THE POTENTIAL IN</span>
          {["Plastic", "Paper & cardboard", "Metal", "Glass", "Reusables"].map((label) => (
            <span key={label} className="flex items-center gap-2 text-xs text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />{label}
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-green-600">THE OPPORTUNITY</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Valuable materials.<br />Missing connections.</h2>
          <p className="mt-5 max-w-lg text-sm leading-8 text-zinc-500">
            Materials lose their value when people don’t know what they are, who needs them, or where to bring them. Trashure connects those missing pieces.
          </p>
        </div>
        <div className="space-y-4">
          {[
            { icon: Brain, title: "Recognize what you have", text: "Understand the likely material before deciding what to do." },
            { icon: Handshake, title: "Find its next destination", text: "Discover accepting recyclers and active collection drives." },
            { icon: BarChart3, title: "Make recovery visible", text: "Turn completed recovery into useful community records." },
          ].map((item) => (
            <article key={item.title} className="flex items-start gap-4 rounded-2xl border border-green-100 bg-green-50/40 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 ring-1 ring-green-100"><item.icon className="h-5 w-5" /></span>
              <div><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-7 text-zinc-500">{item.text}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="scroll-mt-24 border-y border-green-100 bg-gradient-to-b from-green-50 to-white px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-green-600">YOUR RECOVERY OPTIONS</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">One item.<span className="block text-green-600">Four ways forward.</span></h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-zinc-500">The right option depends on your material, its condition, and what’s available nearby.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recoveryPaths.map((path, index) => (
              <article key={path.title} className="rounded-3xl border border-green-100 bg-white p-6 transition hover:border-green-300 hover:shadow-lg hover:shadow-green-900/5">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 text-green-600"><path.icon className="h-6 w-6" /></span>
                  <span className="font-mono text-xs text-green-400">0{index + 1}</span>
                </div>
                <h3 className="mt-7 text-2xl font-bold">{path.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-500">{path.description}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 flex items-start justify-center gap-2 text-xs leading-relaxed text-zinc-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            Partner availability, prices, and drives come from platform records.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-gradient-to-br from-green-950 via-emerald-950 to-green-900 px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold tracking-[0.16em] text-green-400">HOW IT WORKS</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">From your camera<br /><span className="text-green-300">to a clear next step.</span></h2>
          <p className="mt-5 max-w-xl text-sm leading-8 text-green-100/60">A simple process that keeps you in control—from the first photo to the final recovery.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <article key={step.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 font-mono text-sm font-bold">0{index + 1}</span>
                  <step.icon className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="mt-7 text-lg font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-green-100/60">{step.description}</p>
              </article>
            ))}
          </div>
          <p className="mt-7 flex items-start gap-2 text-xs leading-relaxed text-green-100/75"><ShieldCheck className="h-4 w-4 shrink-0 text-green-400" />AI suggests the material. You review and confirm it.</p>
        </div>
      </section>

      {/* New section */}
      <section id="before-you-scan" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-green-600">BEFORE YOU SCAN</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">A clearer photo.<br /><span className="text-green-600">A better starting point.</span></h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-zinc-500">Help Trashure see your item clearly with a few simple photo habits.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { icon: Sun, title: "Use good lighting", text: "Choose a well-lit area and avoid strong shadows or glare." },
            { icon: ImageIcon, title: "Keep one item in focus", text: "Place your item against a simple background so its shape and details are visible." },
            { icon: CheckCircle2, title: "Review the suggestion", text: "Check the identified material and correct it if it doesn’t match your item." },
          ].map((tip) => (
            <article key={tip.title} className="rounded-3xl border border-green-100 bg-gradient-to-br from-green-50/70 to-white p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-green-600 shadow-sm ring-1 ring-green-100"><tip.icon className="h-6 w-6" /></span>
              <h3 className="mt-5 text-lg font-semibold">{tip.title}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-500">{tip.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-green-100 bg-green-50/60 p-5 sm:flex-row sm:items-center">
          <p className="text-sm text-green-800">Have an item nearby? Try the scanner preview above.</p>
          <a href="#scanner" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-green-700 ring-1 ring-green-200 transition hover:bg-green-100">
            Try a scan <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section id="benefits" className="scroll-mt-24 border-y border-green-100 bg-green-50/40 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold tracking-[0.16em] text-green-600">BUILT AROUND YOUR COMMUNITY</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Better connections.<span className="block text-green-600">More useful outcomes.</span></h2>
            <p className="mt-5 text-sm leading-8 text-zinc-500">Designed for communities like Isabela City, Philippines. Connect the people with materials to the people who can put them to use.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {[
              { icon: Users, title: "For residents", text: "Find a clear next step for materials at home." },
              { icon: Building2, title: "For recyclers", text: "Discover opportunities matching the materials you accept." },
              { icon: GraduationCap, title: "For schools", text: "Connect collection drives with community contributions." },
              { icon: BarChart3, title: "For local government", text: "Monitor completed recovery and participation." },
            ].map((role) => (
              <article key={role.title} className="flex items-start gap-4 rounded-3xl border border-green-100 bg-white p-6 sm:p-8">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600"><role.icon className="h-6 w-6" /></span>
                <div><h3 className="text-lg font-semibold">{role.title}</h3><p className="mt-2 text-sm leading-7 text-zinc-500">{role.text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="dashboard" className="mx-auto grid max-w-7xl scroll-mt-24 items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-green-600">RECOVERY YOU CAN TRACK</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Turn local action<br />into meaningful insight.</h2>
          <p className="mt-5 text-sm leading-8 text-zinc-500">Understand what’s being recovered, where participation is happening, and how materials move through the community.</p>
          <Link href="/login" className={`${primaryButton} mt-7 w-full sm:w-auto`}>Access your dashboard <ArrowRight className="h-4 w-4 shrink-0" /></Link>
        </div>
        <div className="rounded-[28px] border border-green-100 bg-white p-6 shadow-xl shadow-green-900/5">
          <div className="flex items-center gap-3 border-b border-green-50 pb-5"><BarChart3 className="h-6 w-6 text-green-600" /><h3 className="font-semibold">Community monitoring</h3></div>
          <div className="mt-5 space-y-3">
            {[
              { title: "Recovered materials", text: "Track completed recovery and recorded collection weights." },
              { title: "Barangay participation", text: "See where community recovery activity takes place." },
              { title: "Reporting periods", text: "Explore activity within your selected timeframe." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-green-50/60 p-4"><p className="text-sm font-semibold">{item.title}</p><p className="mt-2 text-xs leading-relaxed text-zinc-500">{item.text}</p></div>
             ))}
          </div>

          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-green-800">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Impact is based on completed recovery, not just scans. Estimated
            and actual weights are disclosed.
          </p>
        </div>
      </section>






      {/* Final CTA */}



      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-20">
        <div className="relative isolate overflow-hidden rounded-[32px] bg-gradient-to-r from-green-600 to-emerald-800 px-6 py-14 text-center text-white sm:px-12 sm:py-16">
          <Recycle aria-hidden="true" className="pointer-events-none absolute -right-12 -top-8 -z-10 h-80 w-80 -rotate-12 text-white/[0.06]" />
          <p className="text-xs font-semibold tracking-wider text-green-100">THE NEXT CHAPTER STARTS WITH YOU</p>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">See potential.<br />Where others see waste.</h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-green-50/80">Start with one item. Discover a better destination.</p>
          <Link href="/login" className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold text-green-700 transition hover:bg-green-50 sm:w-auto">
            Start your Trashure journey <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
          <p className="mt-5 text-xs text-green-100/70">Scan it. Confirm it. Recover it.</p>
        </div>
      </section>

      <footer className="bg-zinc-950 px-5 pb-8 pt-12 text-zinc-400 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="" className="h-10 w-10 rounded-xl bg-white object-contain" />
              <span className="text-2xl font-black tracking-tight text-green-400">TRASHURE</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-7">Turn materials into useful resources, meaningful connections, and measurable community action.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Platform</h3>
            <div className="mt-5 grid gap-3 text-sm">
              {navigation.map((item) => <a key={item.href} href={item.href} className="hover:text-green-400">{item.label}</a>)}
              <Link href="/about-the-developer" className="hover:text-green-400">About developer</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Resources</h3>
            <div className="mt-5 grid gap-3 text-sm">
              {[
                { label: "Documentation", href: "/documentation" },
                { label: "Privacy policy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
                { label: "Contact", href: "/contact" },
              ].map((item) => <Link key={item.href} href={item.href} className="hover:text-green-400">{item.label}</Link>)}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-3 border-t border-zinc-800 pt-7 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} Trashure. All rights reserved.</p>
          <p>Developed by <span className="font-semibold text-green-400">Team Aureloop</span></p>
        </div>
      </footer>

      <DownloadApkPrompt />

      <style jsx global>{`
        .trashure-page a:focus-visible,
        .trashure-page button:focus-visible {
          outline: 3px solid #22c55e;
          outline-offset: 4px;
        }

        .trashure-scan-beam {
          position: absolute;
          left: -18px;
          right: -18px;
          height: 2px;
          background: #22c55e;
          box-shadow: 0 0 12px #22c55e, 0 0 24px rgba(34, 197, 94, 0.4);
          animation: trashure-scan-sweep 1.25s ease-in-out infinite alternate;
        }

        .trashure-scan-beam::before {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 65px;
          background: linear-gradient(to bottom, transparent, rgba(34, 197, 94, 0.22));
        }

        @keyframes trashure-scan-sweep {
          from { top: 0; }
          to { top: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .trashure-scan-beam {
            animation: none;
            top: 50%;
          }

          .trashure-page *,
          .trashure-page *::before,
          .trashure-page *::after {
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}